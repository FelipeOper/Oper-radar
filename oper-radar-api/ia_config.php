<?php
/**
 * OPER RADAR — API: provedores de IA do Analista (so administrador).
 * GET  ia_config.php                                         -> { provedores: [...], em_uso: {...}|null }
 * POST ia_config.php {acao:'salvar', provedor, chave?, modelo?, base_url?, ativar?}
 * POST ia_config.php {acao:'testar', provedor}               -> chama o provedor com uma pergunta minima
 * POST ia_config.php {acao:'remover', provedor}
 * A chave nunca volta na resposta; a listagem mostra so os 4 ultimos caracteres. POST exige CSRF.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/ia_provedores.php';

inicia_sessao_oper_radar();
$usuario = exige_papel(['admin']);
$conn = conecta();
ia_garante_tabela($conn);

function resposta_em_uso(?array $cfg): ?array {
    return $cfg ? ['provedor' => $cfg['provedor'], 'modelo' => $cfg['modelo'], 'origem' => $cfg['origem']] : null;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    envia_json(['provedores' => ia_lista($conn), 'em_uso' => resposta_em_uso(ia_config_ativa($conn))]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); envia_json(['erro' => 'Metodo nao permitido']); }
exige_csrf();

$corpo = json_decode(file_get_contents('php://input'), true) ?: [];
$acao = (string)($corpo['acao'] ?? '');
$provedor = (string)($corpo['provedor'] ?? '');
if (!ia_provedor_valido($provedor)) { http_response_code(400); envia_json(['erro' => 'Provedor desconhecido.']); }
$info = IA_PROVEDORES[$provedor];

if ($acao === 'remover') {
    $st = $conn->prepare('DELETE FROM ia_config WHERE provedor=?');
    $st->bind_param('s', $provedor);
    $st->execute();
    envia_json(['ok' => true, 'provedores' => ia_lista($conn), 'em_uso' => resposta_em_uso(ia_config_ativa($conn))]);
}

if ($acao === 'salvar') {
    $chave = trim((string)($corpo['chave'] ?? ''));
    $modelo = trim((string)($corpo['modelo'] ?? ''));
    $baseUrl = trim((string)($corpo['base_url'] ?? ''));
    $ativar = !empty($corpo['ativar']);

    if ($modelo !== '' && !ia_modelo_valido($modelo)) { http_response_code(400); envia_json(['erro' => 'Nome de modelo invalido.']); }
    if ($chave !== '' && (strlen($chave) < 8 || strlen($chave) > 400 || preg_match('/\s/', $chave))) {
        http_response_code(400); envia_json(['erro' => 'A chave parece invalida (sem espacos, entre 8 e 400 caracteres).']);
    }
    $urlFinal = null;
    if ($info['pede_url']) {
        $urlFinal = ia_url_base_valida($baseUrl);
        if (!$urlFinal) { http_response_code(400); envia_json(['erro' => 'Endereco invalido: use https, um dominio publico e a URL base da API (ex.: https://openrouter.ai/api/v1).']); }
        if ($modelo === '') { http_response_code(400); envia_json(['erro' => 'Informe o modelo para este provedor.']); }
    }

    $existe = $conn->prepare('SELECT chave_cifrada FROM ia_config WHERE provedor=?');
    $existe->bind_param('s', $provedor);
    $existe->execute();
    $atual = $existe->get_result()->fetch_assoc();
    if (!$atual && $chave === '') { http_response_code(400); envia_json(['erro' => 'Informe a chave da API.']); }

    $cifrada = $chave !== '' ? ia_cifra($chave) : ($atual['chave_cifrada'] ?? null);
    $final = $chave !== '' ? substr($chave, -4) : null;
    $modeloFinal = $modelo !== '' ? $modelo : $info['modelo_padrao'];
    $uid = (int)($usuario['id'] ?? 0);

    $conn->begin_transaction();
    try {
        if ($chave !== '' || !$atual) {
            $st = $conn->prepare('INSERT INTO ia_config (provedor, chave_cifrada, chave_final, modelo, base_url, ativo, atualizado_por)
                VALUES (?,?,?,?,?,0,?) ON DUPLICATE KEY UPDATE chave_cifrada=VALUES(chave_cifrada), chave_final=VALUES(chave_final),
                modelo=VALUES(modelo), base_url=VALUES(base_url), atualizado_por=VALUES(atualizado_por)');
            $st->bind_param('sssssi', $provedor, $cifrada, $final, $modeloFinal, $urlFinal, $uid);
        } else {
            $st = $conn->prepare('UPDATE ia_config SET modelo=?, base_url=?, atualizado_por=? WHERE provedor=?');
            $st->bind_param('ssis', $modeloFinal, $urlFinal, $uid, $provedor);
        }
        $st->execute();
        if ($ativar) {
            $conn->query('UPDATE ia_config SET ativo=0');
            $st = $conn->prepare('UPDATE ia_config SET ativo=1 WHERE provedor=?');
            $st->bind_param('s', $provedor);
            $st->execute();
        }
        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollback();
        error_log('ia_config salvar: ' . $e->getMessage());
        http_response_code(500);
        envia_json(['erro' => 'Nao foi possivel salvar.']);
    }
    envia_json(['ok' => true, 'provedores' => ia_lista($conn), 'em_uso' => resposta_em_uso(ia_config_ativa($conn))]);
}

if ($acao === 'testar') {
    $st = $conn->prepare('SELECT chave_cifrada, modelo, base_url FROM ia_config WHERE provedor=? AND chave_cifrada IS NOT NULL');
    $st->bind_param('s', $provedor);
    $st->execute();
    $linha = $st->get_result()->fetch_assoc();
    $chave = $linha ? ia_decifra((string)$linha['chave_cifrada']) : null;
    if (!$chave) { http_response_code(400); envia_json(['ok' => false, 'erro' => 'Salve a chave deste provedor antes de testar.']); }
    $cfg = ['provedor' => $provedor, 'chave' => $chave, 'base_url' => $linha['base_url'],
            'modelo' => $linha['modelo'] !== '' ? $linha['modelo'] : $info['modelo_padrao']];
    $r = ia_chama($cfg, 'Responda apenas: ok', [['role' => 'user', 'content' => 'Teste de conexao.']], 20);
    envia_json(['ok' => $r['ok'], 'erro' => $r['erro'], 'modelo' => $cfg['modelo']]);
}

http_response_code(400);
envia_json(['erro' => 'Acao desconhecida.']);
