<?php
/**
 * Detalhes e curadoria de um anúncio.
 *
 * GET  ?id=123: painel comparativo, similares e histórico.
 * POST: correção manual de FIPE/KM ou restauração do vínculo automático.
 */
require_once __DIR__ . '/config.php';
inicia_sessao_oper_radar();
$usuario = exige_autenticacao();
$conn = conecta();

function detalhe_numero($valor) {
    return $valor === null ? null : (float)$valor;
}

function envia_detalhe_anuncio(mysqli $conn, int $id): void {
    $sql = "SELECT a.id, a.anuncio_portal_id, a.url, a.titulo, a.tipo, a.marca, a.modelo,
                   a.ano_inicial, a.ano_final, a.cor, a.km_ou_horas, a.quilometragem_manual,
                   a.preco, a.preco_texto_bruto, a.status, a.primeira_vez_visto,
                   a.ultima_vez_ativo, a.data_remocao, a.fipe_preco_id,
                   a.fipe_preco_automatico_id, a.fipe_vinculo_origem,
                   a.fipe_match_status, a.fipe_match_confianca, a.fipe_match_motivo,
                   a.curadoria_observacao, a.curadoria_atualizada_em,
                   r.nome AS revenda, r.cidade, r.uf,
                   fp.preco AS preco_fipe, fp.codigo_fipe, fp.ano_codigo,
                   fp.mes_referencia, fm.marca_fipe, fm.modelo_fipe,
                   mc.anuncios_comparaveis, mc.preco_medio_mercado,
                   mc.menor_preco_mercado, mc.maior_preco_mercado,
                   u.nome AS curadoria_usuario
            FROM anuncio a
            JOIN revenda r ON r.id=a.revenda_id
            LEFT JOIN fipe_preco fp ON fp.id=a.fipe_preco_id
            LEFT JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
            LEFT JOIN (
                SELECT fipe_preco_id, COUNT(*) AS anuncios_comparaveis,
                       AVG(NULLIF(preco,0)) AS preco_medio_mercado,
                       MIN(NULLIF(preco,0)) AS menor_preco_mercado,
                       MAX(NULLIF(preco,0)) AS maior_preco_mercado
                FROM anuncio
                WHERE status='ativo' AND fipe_preco_id IS NOT NULL AND preco>0
                GROUP BY fipe_preco_id
            ) mc ON mc.fipe_preco_id=a.fipe_preco_id
            LEFT JOIN usuario u ON u.id=a.curadoria_usuario_id
            WHERE a.id=? LIMIT 1";
    $st = $conn->prepare($sql);
    $st->bind_param('i', $id);
    $st->execute();
    $anuncio = $st->get_result()->fetch_assoc();
    $st->close();
    if (!$anuncio) {
        http_response_code(404);
        envia_json(['erro' => 'Anúncio não encontrado.']);
    }

    foreach (['id', 'anuncio_portal_id', 'ano_inicial', 'ano_final', 'fipe_preco_id',
              'fipe_preco_automatico_id', 'quilometragem_manual'] as $campo) {
        $anuncio[$campo] = $anuncio[$campo] === null ? null : (int)$anuncio[$campo];
    }
    $anuncio['ano_fabricacao'] = $anuncio['ano_inicial'];
    $anuncio['ano_modelo'] = $anuncio['ano_final'] ?: $anuncio['ano_inicial'];
    $anuncio['preco'] = detalhe_numero($anuncio['preco']);
    $anuncio['preco_fipe'] = detalhe_numero($anuncio['preco_fipe']);
    $anuncio['anuncios_comparaveis'] = (int)($anuncio['anuncios_comparaveis'] ?? 0);
    foreach (['preco_medio_mercado', 'menor_preco_mercado', 'maior_preco_mercado'] as $campo) {
        $anuncio[$campo] = detalhe_numero($anuncio[$campo]);
    }
    $anuncio['quilometragem_exibida'] = $anuncio['quilometragem_manual'] !== null
        ? $anuncio['quilometragem_manual'] . ' km'
        : ($anuncio['km_ou_horas'] ?: null);
    $anuncio['quilometragem_origem'] = $anuncio['quilometragem_manual'] !== null
        ? 'curadoria' : ($anuncio['km_ou_horas'] ? 'coleta' : null);

    $similares = [];
    if ($anuncio['fipe_preco_id']) {
        $st = $conn->prepare("SELECT a.id, a.anuncio_portal_id, a.titulo, a.preco, a.url,
                                    r.nome AS revenda, r.cidade, r.uf,
                                    COALESCE(CONCAT(a.quilometragem_manual, ' km'), a.km_ou_horas) AS quilometragem
                             FROM anuncio a
                             JOIN revenda r ON r.id=a.revenda_id
                             WHERE a.status='ativo' AND a.fipe_preco_id=? AND a.id<>?
                             ORDER BY a.preco IS NULL, a.preco ASC, a.ultima_vez_ativo DESC
                             LIMIT 8");
        $st->bind_param('ii', $anuncio['fipe_preco_id'], $id);
        $st->execute();
        $res = $st->get_result();
        while ($row = $res->fetch_assoc()) {
            $row['id'] = (int)$row['id'];
            $row['anuncio_portal_id'] = (int)$row['anuncio_portal_id'];
            $row['preco'] = detalhe_numero($row['preco']);
            $similares[] = $row;
        }
        $st->close();
    }

    $sugestoes = [];
    if (!$anuncio['fipe_preco_id']) {
        $st = $conn->prepare("SELECT fp.id, s.posicao, s.score, s.confianca, s.motivos,
                                    fp.preco AS preco_fipe, fp.codigo_fipe, fp.ano_codigo,
                                    fp.mes_referencia, fm.marca_fipe AS marca, fm.modelo_fipe AS modelo
                             FROM anuncio_fipe_sugestao s
                             JOIN fipe_preco fp ON fp.id=s.fipe_preco_id
                             JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
                             WHERE s.anuncio_id=?
                             ORDER BY s.posicao, s.score DESC, fp.id
                             LIMIT 8");
        $st->bind_param('i', $id);
        $st->execute();
        $res = $st->get_result();
        while ($row = $res->fetch_assoc()) {
            foreach (['id', 'posicao', 'score'] as $campo) $row[$campo] = (int)$row[$campo];
            $row['preco_fipe'] = detalhe_numero($row['preco_fipe']);
            $sugestoes[] = $row;
        }
        $st->close();
    }

    $historico = [];
    $st = $conn->prepare("SELECT l.id, l.acao, l.fipe_preco_anterior_id, l.fipe_preco_novo_id,
                                l.quilometragem_anterior, l.quilometragem_nova,
                                l.observacao, l.criado_em, u.nome AS usuario
                         FROM anuncio_curadoria_log l
                         JOIN usuario u ON u.id=l.usuario_id
                         WHERE l.anuncio_id=? ORDER BY l.id DESC LIMIT 20");
    $st->bind_param('i', $id);
    $st->execute();
    $res = $st->get_result();
    while ($row = $res->fetch_assoc()) {
        foreach (['id', 'fipe_preco_anterior_id', 'fipe_preco_novo_id'] as $campo) {
            $row[$campo] = $row[$campo] === null ? null : (int)$row[$campo];
        }
        $historico[] = $row;
    }
    $st->close();

    envia_json([
        'anuncio' => $anuncio,
        'sugestoes_fipe' => $sugestoes,
        'similares' => $similares,
        'historico' => $historico,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = max(0, (int)($_GET['id'] ?? 0));
    if (!$id) {
        http_response_code(422);
        envia_json(['erro' => 'Informe o anúncio.']);
    }
    envia_detalhe_anuncio($conn, $id);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    envia_json(['erro' => 'Método não permitido.']);
}

if (!in_array($usuario['papel'], ['admin', 'gestor'], true)) {
    http_response_code(403);
    envia_json(['erro' => 'Somente Admin ou Gestor pode alterar a curadoria.']);
}
exige_csrf();
$dados = json_decode(file_get_contents('php://input'), true);
$dados = is_array($dados) ? $dados : [];
$id = max(0, (int)($dados['id'] ?? 0));
$acao = (string)($dados['acao'] ?? 'salvar_curadoria');
if (!$id) {
    http_response_code(422);
    envia_json(['erro' => 'Informe o anúncio.']);
}

$conn->begin_transaction();
try {
    $st = $conn->prepare("SELECT id, fipe_preco_id, fipe_preco_automatico_id,
                                fipe_match_status, fipe_match_status_automatico,
                                fipe_match_confianca, fipe_match_confianca_automatico,
                                fipe_match_motivo, fipe_match_motivo_automatico,
                                fipe_vinculo_origem, km_ou_horas, quilometragem_manual,
                                curadoria_observacao
                         FROM anuncio WHERE id=? FOR UPDATE");
    $st->bind_param('i', $id);
    $st->execute();
    $atual = $st->get_result()->fetch_assoc();
    $st->close();
    if (!$atual) throw new InvalidArgumentException('Anúncio não encontrado.');

    $fipeAntes = $atual['fipe_preco_id'] === null ? null : (int)$atual['fipe_preco_id'];
    $kmAntes = $atual['quilometragem_manual'] !== null
        ? ((int)$atual['quilometragem_manual']) . ' km'
        : ($atual['km_ou_horas'] ?: null);

    if ($acao === 'restaurar_fipe_automatico') {
        if ($atual['fipe_vinculo_origem'] !== 'manual') {
            throw new InvalidArgumentException('Este anúncio já usa o vínculo automático.');
        }
        $st = $conn->prepare("UPDATE anuncio
                             SET fipe_preco_id=fipe_preco_automatico_id,
                                 fipe_match_status=fipe_match_status_automatico,
                                 fipe_match_confianca=fipe_match_confianca_automatico,
                                 fipe_match_motivo=fipe_match_motivo_automatico,
                                 fipe_vinculo_origem='automatico',
                                 curadoria_usuario_id=?, curadoria_atualizada_em=NOW()
                             WHERE id=?");
        $st->bind_param('ii', $usuario['id'], $id);
        $st->execute();
        $st->close();
        $conn->query('DELETE FROM anuncio_fipe_sugestao WHERE anuncio_id=' . (int)$id);
        $fipeDepois = $atual['fipe_preco_automatico_id'] === null ? null : (int)$atual['fipe_preco_automatico_id'];
        $observacao = 'Vínculo automático restaurado';
        $log = $conn->prepare("INSERT INTO anuncio_curadoria_log
            (anuncio_id,usuario_id,acao,fipe_preco_anterior_id,fipe_preco_novo_id,quilometragem_anterior,quilometragem_nova,observacao)
            VALUES (?,?,?,?,?,?,?,?)");
        $log->bind_param('iisiisss', $id, $usuario['id'], $acao, $fipeAntes, $fipeDepois, $kmAntes, $kmAntes, $observacao);
        $log->execute();
        $log->close();
    } elseif ($acao === 'salvar_curadoria') {
        $alterarFipe = !empty($dados['alterar_fipe']);
        $alterarKm = !empty($dados['alterar_quilometragem']);
        $observacao = trim((string)($dados['observacao'] ?? $atual['curadoria_observacao'] ?? ''));
        if (mb_strlen($observacao) > 500) throw new InvalidArgumentException('A observação deve ter até 500 caracteres.');

        $novoFipe = $fipeAntes;
        if ($alterarFipe) {
            $novoFipe = (int)($dados['fipe_preco_id'] ?? 0);
            if ($novoFipe <= 0) throw new InvalidArgumentException('Escolha uma referência FIPE válida.');
            $st = $conn->prepare('SELECT id FROM fipe_preco WHERE id=? LIMIT 1');
            $st->bind_param('i', $novoFipe);
            $st->execute();
            $existeFipe = $st->get_result()->num_rows > 0;
            $st->close();
            if (!$existeFipe) throw new InvalidArgumentException('A referência FIPE escolhida não existe.');
        }

        $novoKm = $atual['quilometragem_manual'] === null ? null : (int)$atual['quilometragem_manual'];
        if ($alterarKm) {
            $valorKm = $dados['quilometragem_manual'] ?? null;
            $novoKm = ($valorKm === '' || $valorKm === null) ? null : (int)$valorKm;
            if ($novoKm !== null && ($novoKm < 0 || $novoKm > 5000000)) {
                throw new InvalidArgumentException('Informe uma quilometragem entre 0 e 5.000.000 km.');
            }
        }

        $autoFipe = $atual['fipe_preco_automatico_id'];
        $autoStatus = $atual['fipe_match_status_automatico'];
        $autoConfianca = $atual['fipe_match_confianca_automatico'];
        $autoMotivo = $atual['fipe_match_motivo_automatico'];
        if ($alterarFipe && $atual['fipe_vinculo_origem'] !== 'manual') {
            $autoFipe = $atual['fipe_preco_id'];
            $autoStatus = $atual['fipe_match_status'];
            $autoConfianca = $atual['fipe_match_confianca'];
            $autoMotivo = $atual['fipe_match_motivo'];
        }
        $origem = $alterarFipe ? 'manual' : $atual['fipe_vinculo_origem'];
        $status = $alterarFipe ? 'vinculado' : $atual['fipe_match_status'];
        $confianca = $alterarFipe ? 'manual' : $atual['fipe_match_confianca'];
        $motivo = $alterarFipe ? ('Curadoria manual por ' . $usuario['nome']) : $atual['fipe_match_motivo'];

        $st = $conn->prepare("UPDATE anuncio SET
            fipe_preco_id=?, fipe_preco_automatico_id=?,
            fipe_match_status=?, fipe_match_status_automatico=?,
            fipe_match_confianca=?, fipe_match_confianca_automatico=?,
            fipe_match_motivo=?, fipe_match_motivo_automatico=?,
            fipe_vinculo_origem=?, quilometragem_manual=?, curadoria_observacao=?,
            curadoria_usuario_id=?, curadoria_atualizada_em=NOW()
            WHERE id=?");
        $st->bind_param('iisssssssisii', $novoFipe, $autoFipe, $status, $autoStatus, $confianca,
            $autoConfianca, $motivo, $autoMotivo, $origem, $novoKm, $observacao, $usuario['id'], $id);
        $st->execute();
        $st->close();
        if ($alterarFipe) {
            $conn->query('DELETE FROM anuncio_fipe_sugestao WHERE anuncio_id=' . (int)$id);
        }

        $kmDepois = $novoKm !== null ? $novoKm . ' km' : ($atual['km_ou_horas'] ?: null);
        $acaoLog = $alterarFipe && $alterarKm ? 'fipe_e_km' : ($alterarFipe ? 'fipe_manual' : ($alterarKm ? 'quilometragem' : 'observacao'));
        $log = $conn->prepare("INSERT INTO anuncio_curadoria_log
            (anuncio_id,usuario_id,acao,fipe_preco_anterior_id,fipe_preco_novo_id,quilometragem_anterior,quilometragem_nova,observacao)
            VALUES (?,?,?,?,?,?,?,?)");
        $log->bind_param('iisiisss', $id, $usuario['id'], $acaoLog, $fipeAntes, $novoFipe, $kmAntes, $kmDepois, $observacao);
        $log->execute();
        $log->close();
    } else {
        throw new InvalidArgumentException('Ação inválida.');
    }

    $conn->commit();
} catch (InvalidArgumentException $e) {
    $conn->rollback();
    http_response_code(422);
    envia_json(['erro' => $e->getMessage()]);
} catch (Throwable $e) {
    $conn->rollback();
    error_log('curadoria anuncio: ' . $e->getMessage());
    http_response_code(500);
    envia_json(['erro' => 'Não foi possível salvar a curadoria.']);
}

envia_detalhe_anuncio($conn, $id);
