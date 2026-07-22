<?php
/** Importacao e sincronizacao do estoque proprio a partir de XML. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/xml_estoque.php';
$usuario = exige_autenticacao();
$conn = conecta();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = $conn->prepare('SELECT id,arquivo_nome,total_lidos,total_novos,total_atualizados,total_ignorados,total_ausentes,criado_em FROM meu_estoque_importacao WHERE usuario_id=? ORDER BY id DESC LIMIT 5');
    $st->bind_param('i', $usuario['id']); $st->execute();
    $res = $st->get_result(); $historico = [];
    while ($row = $res->fetch_assoc()) {
        foreach (['id','total_lidos','total_novos','total_atualizados','total_ignorados','total_ausentes'] as $campo) $row[$campo] = (int)$row[$campo];
        $historico[] = $row;
    }
    $st->close();
    envia_json(['historico' => $historico]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); envia_json(['erro' => 'Metodo nao permitido']); }
exige_csrf();

if (!isset($_FILES['arquivo']) || !is_uploaded_file($_FILES['arquivo']['tmp_name'])) {
    http_response_code(422); envia_json(['erro' => 'Selecione um arquivo XML.']);
}
if ((int)$_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(422); envia_json(['erro' => 'O upload do XML nao foi concluido.']);
}
$conteudo = file_get_contents($_FILES['arquivo']['tmp_name']);
if ($conteudo === false) { http_response_code(422); envia_json(['erro' => 'Nao foi possivel ler o arquivo.']); }

try {
    $leitura = xml_estoque_ler($conteudo);
} catch (RuntimeException $e) {
    http_response_code(422); envia_json(['erro' => $e->getMessage()]);
}

// Um feed pode repetir o mesmo veiculo em secoes diferentes. A ultima versao vence.
$unicos = [];
foreach ($leitura['itens'] as $item) $unicos[$item['origem_chave']] = $item;
$duplicados = count($leitura['itens']) - count($unicos);
$itens = array_values($unicos);
$acao = (string)($_GET['acao'] ?? $_POST['acao'] ?? 'analisar');

if ($acao === 'analisar') {
    $comReferencia = count(array_filter($itens, fn($i) => $i['referencia_interna'] !== '' || $i['placa']));
    $comPreco = count(array_filter($itens, fn($i) => $i['preco_anunciado'] !== null));
    envia_json([
        'ok' => true,
        'resumo' => [
            'validos' => count($itens), 'ignorados' => (int)$leitura['ignorados'],
            'duplicados' => $duplicados, 'com_referencia' => $comReferencia, 'com_preco' => $comPreco,
        ],
        'amostra' => array_slice(array_map(function ($i) {
            return array_intersect_key($i, array_flip(['referencia_interna','marca','modelo','ano','preco_anunciado','cidade','uf','status','placa']));
        }, $itens), 0, 8),
    ]);
}
if ($acao !== 'importar') { http_response_code(400); envia_json(['erro' => 'Acao desconhecida.']); }

$usarComparativo = filter_var($_POST['usar_comparativo'] ?? '1', FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
$marcarAusentes = filter_var($_POST['marcar_ausentes'] ?? '0', FILTER_VALIDATE_BOOLEAN);
$arquivoNome = mb_substr(basename((string)$_FILES['arquivo']['name']), 0, 190);

function fipe_para_item_xml(mysqli $conn, array $item): ?int {
    if (!empty($item['codigo_fipe'])) {
        $codigo = $item['codigo_fipe'];
        $anoLike = $item['ano'] ? $item['ano'] . '-%' : '%';
        $st = $conn->prepare('SELECT id FROM fipe_preco WHERE codigo_fipe=? AND ano_codigo LIKE ? ORDER BY referencia_codigo DESC LIMIT 1');
        $st->bind_param('ss', $codigo, $anoLike); $st->execute();
        $row = $st->get_result()->fetch_assoc(); $st->close();
        if ($row) return (int)$row['id'];
    }
    if (!$item['ano'] || !$item['marca']) return null;
    $aliases = ['MB'=>'MERCEDES-BENZ','MERCEDES'=>'MERCEDES-BENZ','VW'=>'VOLKSWAGEN','VOLKS'=>'VOLKSWAGEN'];
    $marca = strtoupper(trim($item['marca']));
    $marca = $aliases[$marca] ?? $marca;
    preg_match('/\d{3,5}/', $item['modelo'], $m);
    if (empty($m[0])) return null;
    $numero = '%' . $m[0] . '%'; $anoLike = $item['ano'] . '-%'; $marcaLike = '%' . $marca . '%';
    $st = $conn->prepare("SELECT fm.id modelo_id, MAX(fp.id) preco_id FROM fipe_modelo fm JOIN fipe_preco fp ON fp.fipe_modelo_id=fm.id WHERE fm.marca_fipe LIKE ? AND fm.modelo_fipe LIKE ? AND fp.ano_codigo LIKE ? GROUP BY fm.id LIMIT 3");
    $st->bind_param('sss', $marcaLike, $numero, $anoLike); $st->execute();
    $res = $st->get_result(); $candidatos = [];
    while ($row = $res->fetch_assoc()) $candidatos[] = (int)$row['preco_id'];
    $st->close();
    return count($candidatos) === 1 ? $candidatos[0] : null;
}

$conn->begin_transaction();
try {
    $total = count($itens); $novos = 0; $atualizados = 0; $ausentes = 0;
    $ignorados = (int)$leitura['ignorados'] + $duplicados;
    $stLog = $conn->prepare('INSERT INTO meu_estoque_importacao (usuario_id,arquivo_nome,arquivo_hash,total_lidos,total_ignorados) VALUES (?,?,?,?,?)');
    $stLog->bind_param('issii', $usuario['id'], $arquivoNome, $leitura['hash'], $total, $ignorados);
    $stLog->execute(); $importacaoId = (int)$stLog->insert_id; $stLog->close();

    $busca = $conn->prepare("SELECT id,fipe_preco_id FROM meu_estoque WHERE usuario_id=? AND origem='xml' AND origem_chave=? LIMIT 1");
    $insere = $conn->prepare("INSERT INTO meu_estoque (usuario_id,referencia_interna,marca,modelo,ano,preco_anunciado,cidade,uf,data_entrada,status,fipe_preco_id,origem,origem_chave,placa,quilometragem,url_anuncio,imagem_url,usar_comparativo,xml_importacao_id,ultima_sincronizacao) VALUES (?,?,?,?,?,?,?,?,?,?,?,'xml',?,?,?,?,?,?,?,NOW())");
    $atualiza = $conn->prepare("UPDATE meu_estoque SET referencia_interna=?,marca=?,modelo=?,ano=?,preco_anunciado=?,cidade=?,uf=?,data_entrada=?,status=?,fipe_preco_id=?,placa=?,quilometragem=?,url_anuncio=?,imagem_url=?,usar_comparativo=?,xml_importacao_id=?,ultima_sincronizacao=NOW() WHERE id=? AND usuario_id=?");

    foreach ($itens as $item) {
        $busca->bind_param('is', $usuario['id'], $item['origem_chave']); $busca->execute();
        $existente = $busca->get_result()->fetch_assoc();
        $fipeId = fipe_para_item_xml($conn, $item);
        if (!$fipeId && $existente && $existente['fipe_preco_id']) $fipeId = (int)$existente['fipe_preco_id'];
        if ($existente) {
            $id = (int)$existente['id'];
            $atualiza->bind_param('sssidssssisissiiii',
                $item['referencia_interna'],$item['marca'],$item['modelo'],$item['ano'],$item['preco_anunciado'],
                $item['cidade'],$item['uf'],$item['data_entrada'],$item['status'],$fipeId,$item['placa'],
                $item['quilometragem'],$item['url_anuncio'],$item['imagem_url'],$usarComparativo,$importacaoId,$id,$usuario['id']);
            $atualiza->execute(); $atualizados++;
        } else {
            $insere->bind_param('isssidssssississii',
                $usuario['id'],$item['referencia_interna'],$item['marca'],$item['modelo'],$item['ano'],$item['preco_anunciado'],
                $item['cidade'],$item['uf'],$item['data_entrada'],$item['status'],$fipeId,$item['origem_chave'],$item['placa'],
                $item['quilometragem'],$item['url_anuncio'],$item['imagem_url'],$usarComparativo,$importacaoId);
            $insere->execute(); $novos++;
        }
    }
    $busca->close(); $insere->close(); $atualiza->close();

    if ($marcarAusentes) {
        $st = $conn->prepare("UPDATE meu_estoque SET status='vendido',ultima_sincronizacao=NOW() WHERE usuario_id=? AND origem='xml' AND (xml_importacao_id IS NULL OR xml_importacao_id<>?) AND status<>'vendido'");
        $st->bind_param('ii', $usuario['id'], $importacaoId); $st->execute();
        $ausentes = $st->affected_rows; $st->close();
    }
    $st = $conn->prepare('UPDATE meu_estoque_importacao SET total_novos=?,total_atualizados=?,total_ausentes=? WHERE id=? AND usuario_id=?');
    $st->bind_param('iiiii', $novos, $atualizados, $ausentes, $importacaoId, $usuario['id']); $st->execute(); $st->close();
    $conn->commit();
    envia_json(['ok'=>true,'importacao_id'=>$importacaoId,'total'=>$total,'novos'=>$novos,'atualizados'=>$atualizados,'ignorados'=>$ignorados,'ausentes_marcados_vendidos'=>$ausentes]);
} catch (Throwable $e) {
    $conn->rollback();
    error_log('OPER RADAR XML: ' . $e->getMessage());
    http_response_code(500); envia_json(['erro' => 'A importacao foi cancelada sem alterar o estoque. Verifique o XML e tente novamente.']);
}
