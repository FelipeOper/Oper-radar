<?php
// Funcoes puras de lib/ia_provedores.php: nao precisam de banco nem de rede.
function valor_config_oper_radar(string $chave, $padrao = null) { return $padrao; }
require_once __DIR__ . '/../lib/ia_provedores.php';

function verifica($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

// cifra: ida e volta, aleatoria, e chave errada nao abre
$mestra = hash('sha256', 'segredo-de-teste', true);
$a = ia_cifra('sk-ant-abcdef123456', $mestra);
$b = ia_cifra('sk-ant-abcdef123456', $mestra);
verifica($a !== $b, 'IV aleatorio: duas cifras do mesmo texto diferem');
verifica(!str_contains($a, 'abcdef'), 'o texto claro nao aparece na cifra');
verifica(ia_decifra($a, $mestra) === 'sk-ant-abcdef123456', 'ida e volta');
verifica(ia_decifra($a, hash('sha256', 'outro', true)) === null, 'chave mestra errada nao decifra');
verifica(ia_decifra('lixo', $mestra) === null && ia_decifra('v1:@@@', $mestra) === null, 'formato invalido vira null');

// provedores e modelos
verifica(ia_provedor_valido('gemini') && !ia_provedor_valido('x'), 'provedor valido');
verifica(ia_modelo_valido('gpt-4o-mini') && ia_modelo_valido('meta/llama-3.1:70b') && !ia_modelo_valido('a b') && !ia_modelo_valido(''), 'modelo valido');

// url base de provedor compativel: so https publico
$publico = fn($h) => ['93.184.216.34'];
verifica(ia_url_base_valida('https://openrouter.ai/api/v1/', $publico) === 'https://openrouter.ai/api/v1', 'https publico aceito e normalizado');
verifica(ia_url_base_valida('http://openrouter.ai/api/v1', $publico) === null, 'http recusado');
verifica(ia_url_base_valida('https://localhost/v1', $publico) === null, 'localhost recusado');
verifica(ia_url_base_valida('https://127.0.0.1/v1') === null, 'loopback recusado');
verifica(ia_url_base_valida('https://10.0.0.5/v1') === null, 'rede privada recusada');
verifica(ia_url_base_valida('https://169.254.169.254/latest') === null, 'metadados de nuvem recusados');
verifica(ia_url_base_valida('https://x.com@evil.com/v1', $publico) === null, 'credencial embutida recusada');
verifica(ia_url_base_valida('https://api.exemplo.com:22/v1', $publico) === null, 'porta estranha recusada');
verifica(ia_url_base_valida('https://interno.exemplo.com/v1', fn($h) => ['192.168.0.9']) === null, 'dominio que resolve para IP privado recusado');

// requisicoes
$msgs = [['role' => 'user', 'content' => 'oi'], ['role' => 'assistant', 'content' => 'ola'], ['role' => 'user', 'content' => '  '], ['role' => 'user', 'content' => 'e agora?']];
[$url, $h, $corpo] = ia_monta_requisicao(['provedor' => 'anthropic', 'chave' => 'K', 'modelo' => 'claude-sonnet-4-5', 'base_url' => null], 'SIS', $msgs, 100);
verifica($url === 'https://api.anthropic.com/v1/messages' && in_array('x-api-key: K', $h, true), 'anthropic: url e cabecalho');
verifica($corpo['system'] === 'SIS' && count($corpo['messages']) === 3 && $corpo['max_tokens'] === 100, 'anthropic: corpo sem mensagem vazia');

[$url, $h, $corpo] = ia_monta_requisicao(['provedor' => 'openai', 'chave' => 'K', 'modelo' => 'gpt-4o', 'base_url' => null], 'SIS', $msgs, 100);
verifica($url === 'https://api.openai.com/v1/chat/completions' && in_array('Authorization: Bearer K', $h, true), 'openai: url e cabecalho');
verifica($corpo['messages'][0] === ['role' => 'system', 'content' => 'SIS'] && isset($corpo['max_completion_tokens']), 'openai: system primeiro');

[$url, , $corpo] = ia_monta_requisicao(['provedor' => 'compat', 'chave' => 'K', 'modelo' => 'm', 'base_url' => 'https://openrouter.ai/api/v1'], 'SIS', $msgs, 100);
verifica($url === 'https://openrouter.ai/api/v1/chat/completions' && isset($corpo['max_tokens']), 'compat: usa a url base e max_tokens');

[$url, $h, $corpo] = ia_monta_requisicao(['provedor' => 'gemini', 'chave' => 'KEY9', 'modelo' => 'gemini-2.0-flash', 'base_url' => null], 'SIS', $msgs, 100);
verifica($url === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', 'gemini: url');
verifica(in_array('x-goog-api-key: KEY9', $h, true) && !str_contains($url, 'KEY9'), 'gemini: chave em cabecalho, nunca na url');
verifica($corpo['contents'][1]['role'] === 'model' && $corpo['system_instruction']['parts'][0]['text'] === 'SIS', 'gemini: papeis e system_instruction');

// respostas
verifica(ia_extrai_texto('anthropic', ['content' => [['type' => 'text', 'text' => 'a'], ['type' => 'tool_use'], ['type' => 'text', 'text' => 'b']]]) === 'ab', 'anthropic texto');
verifica(ia_extrai_texto('openai', ['choices' => [['message' => ['content' => 'oi']]]]) === 'oi', 'openai texto');
verifica(ia_extrai_texto('compat', ['choices' => [['message' => ['content' => null]]]]) === '', 'compat sem texto');
verifica(ia_extrai_texto('gemini', ['candidates' => [['content' => ['parts' => [['text' => 'x'], ['text' => 'y']]]]]]) === 'xy', 'gemini texto');
verifica(ia_extrai_texto('gemini', []) === '', 'gemini vazio');

// erro do provedor nao vaza a chave
$e = ia_resume_erro(401, json_encode(['error' => ['message' => 'Incorrect API key provided: SEGREDO123']]), 'SEGREDO123');
verifica(str_contains($e, 'recusada') && !str_contains($e, 'SEGREDO123'), 'erro 401 sem a chave');
verifica(str_contains(ia_resume_erro(429, ''), 'saldo'), 'erro 429');

echo "ia_provedores_test ok\n";
