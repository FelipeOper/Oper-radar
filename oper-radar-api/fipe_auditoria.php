<?php
/**
 * OPER RADAR — API: auditoria dos vinculos FIPE x anuncios, dentro do sistema.
 *
 * GET  fipe_auditoria.php?visao=grupos&marca=&modelo=&revenda=&uf=&regiao=&cidade=&confianca=&estado=
 *      Grupos = uma referencia FIPE (modelo + ano) com os anuncios vinculados a ela.
 * GET  fipe_auditoria.php?visao=anuncios&fipe_preco_id=123 (+ os mesmos filtros)
 * POST fipe_auditoria.php {acao: veredito | veredito_lote | limpar, ...}  (admin/gestor + CSRF)
 *
 * O veredito vale para o PAR (anuncio, referencia FIPE): se o vinculo mudar depois, a
 * auditoria antiga deixa de valer sozinha e o anuncio volta a aparecer como nao auditado.
 * Nada aqui altera o vinculo: corrigir continua sendo a curadoria de anuncio_detalhe.php.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_scope.php';

$conn = conecta();

$REGIOES = [
    'Sul' => ['PR','SC','RS'], 'Sudeste' => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste' => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte' => ['AM','PA','RO','RR','AC','AP','TO'],
];
$UF_REGIAO = [];
foreach ($REGIOES as $nomeRegiao => $ufsDaRegiao) {
    foreach ($ufsDaRegiao as $sigla) $UF_REGIAO[$sigla] = $nomeRegiao;
}

const AUD_FROM = "FROM anuncio a
    JOIN revenda r ON r.id = a.revenda_id
    JOIN fipe_preco fp ON fp.id = a.fipe_preco_id
    JOIN fipe_modelo fm ON fm.id = fp.fipe_modelo_id
    LEFT JOIN fipe_auditoria au ON au.anuncio_id = a.id AND au.fipe_preco_id = a.fipe_preco_id";

function aud_tabela_pronta(mysqli $conn): bool {
    $resultado = $conn->query("SHOW TABLES LIKE 'fipe_auditoria'");
    return $resultado && $resultado->num_rows > 0;
}

function aud_consulta(mysqli $conn, string $sql, string $tipos, array $params): array {
    $st = $conn->prepare($sql);
    if (!$st) throw new RuntimeException('Consulta invalida.');
    if ($params) $st->bind_param($tipos, ...$params);
    $st->execute();
    $linhas = $st->get_result()->fetch_all(MYSQLI_ASSOC);
    $st->close();
    return $linhas;
}

/** Monta o WHERE a partir dos filtros. $comEstado=false mede o universo, sem filtrar por auditado. */
function aud_filtros(array $get, array $regioes, array $ufRegiao, bool $comEstado): array {
    $where = ["a.status = 'ativo'", "a.tipo = 'Caminhao'", 'a.fipe_preco_id IS NOT NULL'];
    $params = [];
    $tipos = '';

    if (!empty($get['marca'])) {
        $where[] = 'UPPER(TRIM(a.marca)) = ?';
        $params[] = strtoupper(trim((string)$get['marca']));
        $tipos .= 's';
    }
    if (!empty($get['modelo'])) {
        $where[] = '(a.titulo LIKE ? OR fm.modelo_fipe LIKE ?)';
        $like = '%' . addcslashes(trim((string)$get['modelo']), '%_\\') . '%';
        $params[] = $like;
        $params[] = $like;
        $tipos .= 'ss';
    }
    if (!empty($get['revenda_id']) && (int)$get['revenda_id'] > 0) {
        $where[] = 'r.id = ?';
        $params[] = (int)$get['revenda_id'];
        $tipos .= 'i';
    } elseif (!empty($get['revenda'])) {
        $where[] = 'r.nome LIKE ?';
        $params[] = '%' . addcslashes(trim((string)$get['revenda']), '%_\\') . '%';
        $tipos .= 's';
    }
    if (!empty($get['cidade'])) {
        $where[] = 'r.cidade = ?';
        $params[] = trim((string)$get['cidade']);
        $tipos .= 's';
    }
    if (!empty($get['regiao']) && isset($regioes[$get['regiao']])) {
        $ufsRegiao = $regioes[$get['regiao']];
        $where[] = 'r.uf IN (' . implode(',', array_fill(0, count($ufsRegiao), '?')) . ')';
        foreach ($ufsRegiao as $sigla) { $params[] = $sigla; $tipos .= 's'; }
    } else {
        $ufs = painel_normaliza_ufs((string)($get['uf'] ?? ''), $ufRegiao);
        if ($ufs) {
            $where[] = 'r.uf IN (' . implode(',', array_fill(0, count($ufs), '?')) . ')';
            foreach ($ufs as $sigla) { $params[] = $sigla; $tipos .= 's'; }
        }
    }

    $confianca = (string)($get['confianca'] ?? '');
    if ($confianca === 'manual') {
        $where[] = "a.fipe_vinculo_origem = 'manual'";
    } elseif (in_array($confianca, ['alto', 'medio', 'provisorio'], true)) {
        $where[] = "COALESCE(a.fipe_vinculo_origem, 'automatico') = 'automatico' AND a.fipe_match_confianca = ?";
        $params[] = $confianca;
        $tipos .= 's';
    }

    if ($comEstado) {
        $estado = (string)($get['estado'] ?? 'nao_auditados');
        if ($estado === 'nao_auditados') $where[] = 'au.id IS NULL';
        elseif ($estado === 'corretos') $where[] = "au.veredito = 'correto'";
        elseif ($estado === 'errados') $where[] = "au.veredito = 'errado'";
    }
    return [implode(' AND ', $where), $params, $tipos];
}

function aud_inteiros(array $linha, array $campos): array {
    foreach ($campos as $campo) $linha[$campo] = (int)($linha[$campo] ?? 0);
    return $linha;
}

if (!aud_tabela_pronta($conn)) {
    http_response_code(503);
    envia_json([
        'erro' => 'A auditoria ainda nao foi habilitada neste servidor.',
        'codigo' => 'MIGRACAO_PENDENTE',
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = exige_papel(['admin', 'gestor']);
    exige_csrf();
    $dados = json_decode(file_get_contents('php://input'), true);
    $dados = is_array($dados) ? $dados : [];
    $acao = (string)($dados['acao'] ?? '');
    $usuarioId = (int)($usuario['id'] ?? 0);

    try {
        if ($acao === 'veredito') {
            $anuncioId = (int)($dados['anuncio_id'] ?? 0);
            $fipeId = (int)($dados['fipe_preco_id'] ?? 0);
            $veredito = (string)($dados['veredito'] ?? '');
            $observacao = trim((string)($dados['observacao'] ?? ''));
            if ($anuncioId <= 0 || $fipeId <= 0) throw new InvalidArgumentException('Informe o anuncio e a referencia FIPE.');
            if (!in_array($veredito, ['correto', 'errado'], true)) throw new InvalidArgumentException('Veredito invalido.');
            if (mb_strlen($observacao) > 300) throw new InvalidArgumentException('A observacao deve ter ate 300 caracteres.');
            $observacao = $observacao === '' ? null : $observacao;

            $atual = aud_consulta($conn, 'SELECT fipe_preco_id FROM anuncio WHERE id = ?', 'i', [$anuncioId]);
            if (!$atual) throw new InvalidArgumentException('Anuncio nao encontrado.');
            if ((int)$atual[0]['fipe_preco_id'] !== $fipeId) {
                throw new InvalidArgumentException('O vinculo deste anuncio mudou. Recarregue a lista.');
            }

            $st = $conn->prepare('INSERT INTO fipe_auditoria (anuncio_id, fipe_preco_id, veredito, observacao, usuario_id)
                                  VALUES (?, ?, ?, ?, ?)
                                  ON DUPLICATE KEY UPDATE veredito = VALUES(veredito),
                                      observacao = VALUES(observacao), usuario_id = VALUES(usuario_id)');
            $st->bind_param('iissi', $anuncioId, $fipeId, $veredito, $observacao, $usuarioId);
            $st->execute();
            $st->close();
            envia_json(['ok' => true, 'anuncio_id' => $anuncioId, 'veredito' => $veredito]);
        }

        if ($acao === 'veredito_lote') {
            $fipeId = (int)($dados['fipe_preco_id'] ?? 0);
            $ids = array_values(array_unique(array_filter(array_map('intval', (array)($dados['anuncio_ids'] ?? [])), fn($id) => $id > 0)));
            if ($fipeId <= 0 || !$ids) throw new InvalidArgumentException('Informe a referencia FIPE e os anuncios.');
            if (count($ids) > 200) throw new InvalidArgumentException('Marque no maximo 200 anuncios por vez.');
            if ((string)($dados['veredito'] ?? '') !== 'correto') {
                throw new InvalidArgumentException('O lote so aceita o veredito correto.');
            }
            $marcadores = implode(',', array_fill(0, count($ids), '?'));
            $st = $conn->prepare("INSERT INTO fipe_auditoria (anuncio_id, fipe_preco_id, veredito, usuario_id)
                                  SELECT a.id, a.fipe_preco_id, 'correto', ?
                                  FROM anuncio a
                                  WHERE a.fipe_preco_id = ? AND a.id IN ($marcadores)
                                    AND NOT EXISTS (SELECT 1 FROM fipe_auditoria x
                                                    WHERE x.anuncio_id = a.id AND x.fipe_preco_id = a.fipe_preco_id)");
            $st->bind_param('ii' . str_repeat('i', count($ids)), $usuarioId, $fipeId, ...$ids);
            $st->execute();
            $gravados = $st->affected_rows;
            $st->close();
            envia_json(['ok' => true, 'gravados' => (int)$gravados]);
        }

        if ($acao === 'limpar') {
            $anuncioId = (int)($dados['anuncio_id'] ?? 0);
            $fipeId = (int)($dados['fipe_preco_id'] ?? 0);
            if ($anuncioId <= 0 || $fipeId <= 0) throw new InvalidArgumentException('Informe o anuncio e a referencia FIPE.');
            $st = $conn->prepare('DELETE FROM fipe_auditoria WHERE anuncio_id = ? AND fipe_preco_id = ?');
            $st->bind_param('ii', $anuncioId, $fipeId);
            $st->execute();
            $st->close();
            envia_json(['ok' => true]);
        }

        throw new InvalidArgumentException('Acao invalida.');
    } catch (InvalidArgumentException $e) {
        http_response_code(422);
        envia_json(['erro' => $e->getMessage()]);
    } catch (Throwable $e) {
        error_log('fipe_auditoria: ' . $e->getMessage());
        http_response_code(500);
        envia_json(['erro' => 'Nao foi possivel salvar a auditoria.']);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    envia_json(['erro' => 'Metodo nao permitido.']);
}

exige_autenticacao();

try {
    $visao = (string)($_GET['visao'] ?? 'grupos');

    [$whereUniverso, $paramsUniverso, $tiposUniverso] = aud_filtros($_GET, $REGIOES, $UF_REGIAO, false);
    $resumoLinha = aud_consulta($conn, "SELECT COUNT(*) AS total,
            COALESCE(SUM(au.id IS NOT NULL), 0) AS auditados,
            COALESCE(SUM(au.veredito = 'correto'), 0) AS corretos,
            COALESCE(SUM(au.veredito = 'errado'), 0) AS errados,
            COUNT(DISTINCT a.fipe_preco_id) AS grupos
        " . AUD_FROM . " WHERE $whereUniverso", $tiposUniverso, $paramsUniverso)[0] ?? [];
    $resumo = aud_inteiros($resumoLinha, ['total', 'auditados', 'corretos', 'errados', 'grupos']);
    $julgados = $resumo['corretos'] + $resumo['errados'];
    $resumo['nao_auditados'] = max(0, $resumo['total'] - $resumo['auditados']);
    $resumo['precisao_pct'] = $julgados > 0 ? round(100 * $resumo['corretos'] / $julgados, 1) : null;

    [$where, $params, $tipos] = aud_filtros($_GET, $REGIOES, $UF_REGIAO, true);

    if ($visao === 'anuncios') {
        $fipeId = (int)($_GET['fipe_preco_id'] ?? 0);
        if ($fipeId <= 0) {
            http_response_code(422);
            envia_json(['erro' => 'Informe a referencia FIPE.']);
        }
        $linhas = aud_consulta($conn, "SELECT a.id, a.titulo, a.url, a.marca, a.modelo, a.tracao,
                a.ano_inicial, a.ano_final, a.preco, a.fipe_match_confianca,
                COALESCE(a.fipe_vinculo_origem, 'automatico') AS origem, a.fipe_match_motivo,
                r.id AS revenda_id, r.nome AS revenda, r.cidade, r.uf,
                au.veredito, au.observacao
            " . AUD_FROM . " WHERE $where AND a.fipe_preco_id = ?
            ORDER BY (au.id IS NULL) DESC, a.id LIMIT 100", $tipos . 'i', array_merge($params, [$fipeId]));
        foreach ($linhas as &$linha) {
            $linha = aud_inteiros($linha, ['id', 'revenda_id']);
            $linha['preco'] = $linha['preco'] === null ? null : (float)$linha['preco'];
        }
        unset($linha);
        envia_json(['resumo' => $resumo, 'fipe_preco_id' => $fipeId, 'anuncios' => $linhas]);
    }

    $limite = min(max((int)($_GET['limit'] ?? 30), 1), 60);
    $deslocamento = max((int)($_GET['offset'] ?? 0), 0);
    $grupos = aud_consulta($conn, "SELECT fp.id AS fipe_preco_id, fm.marca_fipe, fm.modelo_fipe, fp.ano_codigo, fp.preco,
            COUNT(*) AS total,
            COALESCE(SUM(au.id IS NOT NULL), 0) AS auditados,
            COALESCE(SUM(au.veredito = 'correto'), 0) AS corretos,
            COALESCE(SUM(au.veredito = 'errado'), 0) AS errados,
            COALESCE(SUM(COALESCE(a.fipe_vinculo_origem, 'automatico') = 'manual'), 0) AS manuais,
            MIN(a.titulo) AS exemplo
        " . AUD_FROM . " WHERE $where
        GROUP BY fp.id, fm.marca_fipe, fm.modelo_fipe, fp.ano_codigo, fp.preco
        ORDER BY (COUNT(*) - COALESCE(SUM(au.id IS NOT NULL), 0)) DESC, COUNT(*) DESC, fp.id
        LIMIT ? OFFSET ?", $tipos . 'ii', array_merge($params, [$limite, $deslocamento]));
    foreach ($grupos as &$grupo) {
        $grupo = aud_inteiros($grupo, ['fipe_preco_id', 'total', 'auditados', 'corretos', 'errados', 'manuais']);
        $grupo['preco'] = $grupo['preco'] === null ? null : (float)$grupo['preco'];
    }
    unset($grupo);
    envia_json([
        'resumo' => $resumo,
        'grupos' => $grupos,
        'tem_mais' => count($grupos) === $limite,
        'proximo_offset' => $deslocamento + count($grupos),
    ]);
} catch (Throwable $e) {
    error_log('fipe_auditoria: ' . $e->getMessage());
    http_response_code(500);
    envia_json(['erro' => 'Nao foi possivel carregar a auditoria.']);
}
