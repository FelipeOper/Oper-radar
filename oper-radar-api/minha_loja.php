<?php
/** Estoque próprio do membro autenticado. */
require_once __DIR__ . '/config.php';
$usuario = exige_autenticacao();
$conn = conecta();

function le_corpo_estoque(): array {
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

function normaliza_estoque(array $dados): array {
    $statusValidos = ['estoque', 'reservado', 'vendido'];
    $uf = strtoupper(trim((string)($dados['uf'] ?? '')));
    $ano = isset($dados['ano']) && $dados['ano'] !== '' ? (int)$dados['ano'] : null;
    $preco = isset($dados['preco_anunciado']) && $dados['preco_anunciado'] !== '' ? (float)$dados['preco_anunciado'] : null;
    $fipe = isset($dados['fipe_preco_id']) && $dados['fipe_preco_id'] !== '' ? (int)$dados['fipe_preco_id'] : null;
    return [
        'referencia_interna' => mb_substr(trim((string)($dados['referencia_interna'] ?? '')), 0, 80),
        'marca' => mb_substr(trim((string)($dados['marca'] ?? '')), 0, 80),
        'modelo' => mb_substr(trim((string)($dados['modelo'] ?? '')), 0, 180),
        'ano' => $ano && $ano >= 1950 && $ano <= ((int)date('Y') + 2) ? $ano : null,
        'preco_anunciado' => $preco && $preco > 0 ? $preco : null,
        'cidade' => mb_substr(trim((string)($dados['cidade'] ?? '')), 0, 120),
        'uf' => preg_match('/^[A-Z]{2}$/', $uf) ? $uf : null,
        'data_entrada' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($dados['data_entrada'] ?? '')) ? $dados['data_entrada'] : date('Y-m-d'),
        'status' => in_array($dados['status'] ?? '', $statusValidos, true) ? $dados['status'] : 'estoque',
        'fipe_preco_id' => $fipe ?: null,
        'usar_comparativo' => !isset($dados['usar_comparativo']) || filter_var($dados['usar_comparativo'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = $conn->prepare("
        SELECT me.id, me.referencia_interna, me.marca, me.modelo, me.ano,
               me.preco_anunciado, me.cidade, me.uf, me.data_entrada, me.status,
               me.fipe_preco_id, me.origem, me.placa, me.quilometragem,
               me.url_anuncio, me.imagem_url, me.usar_comparativo,
               me.ultima_sincronizacao, me.criado_em, me.atualizado_em,
               fp.preco AS preco_fipe, fp.codigo_fipe, fp.mes_referencia,
               fm.marca_fipe, fm.modelo_fipe,
               DATEDIFF(CURDATE(), me.data_entrada) AS dias_estoque,
               (SELECT AVG(NULLIF(a.preco,0)) FROM anuncio a WHERE a.fipe_preco_id=me.fipe_preco_id AND a.status='ativo') AS preco_medio_mercado,
               (SELECT COUNT(*) FROM anuncio a WHERE a.fipe_preco_id=me.fipe_preco_id AND a.status='ativo') AS anuncios_ativos
        FROM meu_estoque me
        LEFT JOIN fipe_preco fp ON fp.id=me.fipe_preco_id
        LEFT JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
        WHERE me.usuario_id=?
        ORDER BY FIELD(me.status,'estoque','reservado','vendido'), me.data_entrada ASC, me.id DESC
    ");
    $st->bind_param('i', $usuario['id']);
    $st->execute();
    $res = $st->get_result();
    $itens = [];
    while ($row = $res->fetch_assoc()) {
        foreach (['id', 'ano', 'fipe_preco_id', 'dias_estoque', 'anuncios_ativos', 'quilometragem', 'usar_comparativo'] as $campo) {
            $row[$campo] = $row[$campo] !== null ? (int)$row[$campo] : null;
        }
        foreach (['preco_anunciado', 'preco_fipe', 'preco_medio_mercado'] as $campo) {
            $row[$campo] = $row[$campo] !== null ? (float)$row[$campo] : null;
        }
        $itens[] = $row;
    }
    $st->close();
    envia_json(['itens' => $itens, 'total' => count($itens)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    envia_json(['erro' => 'Metodo nao permitido']);
}
exige_csrf();
$corpo = le_corpo_estoque();
$acao = (string)($corpo['acao'] ?? 'criar');

if ($acao === 'excluir') {
    $id = (int)($corpo['id'] ?? 0);
    $st = $conn->prepare('DELETE FROM meu_estoque WHERE id=? AND usuario_id=?');
    $st->bind_param('ii', $id, $usuario['id']);
    $st->execute();
    $apagados = $st->affected_rows;
    $st->close();
    envia_json(['ok' => $apagados > 0]);
}

$item = normaliza_estoque($corpo);
if (mb_strlen($item['modelo']) < 2) {
    http_response_code(422);
    envia_json(['erro' => 'Informe o modelo do veículo.']);
}

if ($acao === 'atualizar') {
    $id = (int)($corpo['id'] ?? 0);
    $st = $conn->prepare('UPDATE meu_estoque SET referencia_interna=?,marca=?,modelo=?,ano=?,preco_anunciado=?,cidade=?,uf=?,data_entrada=?,status=?,fipe_preco_id=?,usar_comparativo=? WHERE id=? AND usuario_id=?');
    $st->bind_param('sssidssssiiii', $item['referencia_interna'], $item['marca'], $item['modelo'], $item['ano'], $item['preco_anunciado'], $item['cidade'], $item['uf'], $item['data_entrada'], $item['status'], $item['fipe_preco_id'], $item['usar_comparativo'], $id, $usuario['id']);
} else {
    $st = $conn->prepare('INSERT INTO meu_estoque (usuario_id,referencia_interna,marca,modelo,ano,preco_anunciado,cidade,uf,data_entrada,status,fipe_preco_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $st->bind_param('isssidssssi', $usuario['id'], $item['referencia_interna'], $item['marca'], $item['modelo'], $item['ano'], $item['preco_anunciado'], $item['cidade'], $item['uf'], $item['data_entrada'], $item['status'], $item['fipe_preco_id']);
}
$st->execute();
$id = $acao === 'atualizar' ? (int)$corpo['id'] : $st->insert_id;
$st->close();
envia_json(['ok' => true, 'id' => $id]);
