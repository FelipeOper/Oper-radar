<?php
/**
 * Provedores de IA configuraveis pela tela (Claude, GPT, Gemini e qualquer API compativel com OpenAI).
 *
 * A chave fica cifrada no banco (AES-256-GCM) e nunca volta para o navegador: a listagem so mostra os 4 ultimos
 * caracteres. O ambiente (.oper-radar.env, ANTHROPIC_API_KEY) continua valendo como reserva quando nada foi
 * configurado na tela. As funcoes de montar requisicao e extrair texto sao puras, para testar sem rede.
 */

const IA_PROVEDORES = [
    'anthropic' => ['rotulo' => 'Claude (Anthropic)', 'modelo_padrao' => 'claude-sonnet-4-5',
                    'modelos' => ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5', 'claude-sonnet-4-5'],
                    'pede_url' => false],
    'openai'    => ['rotulo' => 'GPT (OpenAI)', 'modelo_padrao' => 'gpt-4o',
                    'modelos' => ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'], 'pede_url' => false],
    'gemini'    => ['rotulo' => 'Gemini (Google)', 'modelo_padrao' => 'gemini-2.0-flash',
                    'modelos' => ['gemini-2.0-flash', 'gemini-1.5-pro'], 'pede_url' => false],
    'compat'    => ['rotulo' => 'Outro (compativel com OpenAI)', 'modelo_padrao' => '',
                    'modelos' => [], 'pede_url' => true],
];

function ia_provedor_valido(string $provedor): bool {
    return isset(IA_PROVEDORES[$provedor]);
}

function ia_modelo_valido(string $modelo): bool {
    return (bool)preg_match('/^[A-Za-z0-9._:\/-]{1,80}$/', $modelo);
}

/**
 * Valida a URL base de um provedor compativel: so https, sem credencial embutida e sem destino interno
 * (loopback, rede privada, link-local). Devolve a URL normalizada (sem barra final) ou null.
 */
function ia_url_base_valida(string $url, ?callable $resolve = null): ?string {
    $url = rtrim(trim($url), '/');
    $partes = parse_url($url);
    if (!$partes || ($partes['scheme'] ?? '') !== 'https' || empty($partes['host']) || isset($partes['user']) || isset($partes['pass'])) {
        return null;
    }
    if (isset($partes['port']) && !in_array((int)$partes['port'], [443, 8443], true)) return null;
    $host = strtolower($partes['host']);
    if ($host === 'localhost' || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) return null;
    $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : ($resolve ? $resolve($host) : (gethostbynamel($host) ?: []));
    if (!$ips) return null;
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return null;
    }
    return $url;
}

function ia_chave_mestra(): string {
    $segredo = valor_config_oper_radar('OPER_RADAR_SECRET', '');
    if ($segredo === '') $segredo = 'db:' . valor_config_oper_radar('OPER_RADAR_DB_PASS', '');
    return hash('sha256', 'oper-radar-ia-v1|' . $segredo, true);
}

function ia_cifra(string $claro, ?string $chaveMestra = null): string {
    $chaveMestra = $chaveMestra ?? ia_chave_mestra();
    $iv = random_bytes(12);
    $tag = '';
    $cifrado = openssl_encrypt($claro, 'aes-256-gcm', $chaveMestra, OPENSSL_RAW_DATA, $iv, $tag);
    if ($cifrado === false) throw new RuntimeException('Falha ao cifrar a chave');
    return 'v1:' . base64_encode($iv . $tag . $cifrado);
}

function ia_decifra(string $guardado, ?string $chaveMestra = null): ?string {
    $chaveMestra = $chaveMestra ?? ia_chave_mestra();
    if (!str_starts_with($guardado, 'v1:')) return null;
    $bruto = base64_decode(substr($guardado, 3), true);
    if ($bruto === false || strlen($bruto) < 29) return null;
    $claro = openssl_decrypt(substr($bruto, 28), 'aes-256-gcm', $chaveMestra, OPENSSL_RAW_DATA, substr($bruto, 0, 12), substr($bruto, 12, 16));
    return $claro === false ? null : $claro;
}

/** Normaliza o historico para papeis user/assistant com texto. */
function ia_normaliza_mensagens(array $mensagens): array {
    $saida = [];
    foreach ($mensagens as $m) {
        $papel = (($m['role'] ?? '') === 'assistant') ? 'assistant' : 'user';
        $texto = trim((string)($m['content'] ?? ''));
        if ($texto !== '') $saida[] = ['role' => $papel, 'content' => $texto];
    }
    return $saida;
}

/** Monta [url, cabecalhos, corpo] da chamada do provedor. $cfg: provedor, chave, modelo, base_url. */
function ia_monta_requisicao(array $cfg, string $sistema, array $mensagens, int $maxTokens = 1200): array {
    $mensagens = ia_normaliza_mensagens($mensagens);
    $modelo = (string)$cfg['modelo'];
    switch ($cfg['provedor']) {
        case 'anthropic':
            return ['https://api.anthropic.com/v1/messages',
                ['Content-Type: application/json', 'x-api-key: ' . $cfg['chave'], 'anthropic-version: 2023-06-01'],
                ['model' => $modelo, 'max_tokens' => $maxTokens, 'system' => $sistema, 'messages' => $mensagens]];
        case 'openai':
        case 'compat':
            $base = $cfg['provedor'] === 'openai' ? 'https://api.openai.com/v1' : (string)$cfg['base_url'];
            $corpo = ['model' => $modelo, 'messages' => array_merge([['role' => 'system', 'content' => $sistema]], $mensagens)];
            $corpo[$cfg['provedor'] === 'openai' ? 'max_completion_tokens' : 'max_tokens'] = $maxTokens;
            return [$base . '/chat/completions', ['Content-Type: application/json', 'Authorization: Bearer ' . $cfg['chave']], $corpo];
        case 'gemini':
            $conteudos = array_map(fn($m) => ['role' => $m['role'] === 'assistant' ? 'model' : 'user', 'parts' => [['text' => $m['content']]]], $mensagens);
            return ['https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($modelo) . ':generateContent',
                ['Content-Type: application/json', 'x-goog-api-key: ' . $cfg['chave']],
                ['system_instruction' => ['parts' => [['text' => $sistema]]], 'contents' => $conteudos,
                 'generationConfig' => ['maxOutputTokens' => $maxTokens]]];
    }
    throw new InvalidArgumentException('Provedor desconhecido');
}

/** Texto da resposta, ou '' quando o formato nao traz texto. */
function ia_extrai_texto(string $provedor, array $dados): string {
    if ($provedor === 'anthropic') {
        $texto = '';
        foreach (($dados['content'] ?? []) as $bloco) if (($bloco['type'] ?? '') === 'text') $texto .= $bloco['text'];
        return $texto;
    }
    if ($provedor === 'gemini') {
        $texto = '';
        foreach (($dados['candidates'][0]['content']['parts'] ?? []) as $parte) $texto .= $parte['text'] ?? '';
        return $texto;
    }
    $conteudo = $dados['choices'][0]['message']['content'] ?? '';
    return is_string($conteudo) ? $conteudo : '';
}

/** Mensagem curta e sem segredo para o erro do provedor. */
function ia_resume_erro(int $http, string $resposta, string $chave = ''): string {
    $dados = json_decode($resposta, true);
    $msg = $dados['error']['message'] ?? $dados['error'] ?? $dados['message'] ?? '';
    $msg = is_string($msg) ? $msg : '';
    if ($chave !== '') $msg = str_replace($chave, '***', $msg);
    $msg = trim(substr($msg, 0, 200));
    if ($http === 401 || $http === 403) return 'A chave foi recusada pelo provedor (HTTP ' . $http . ').' . ($msg !== '' ? ' ' . $msg : '');
    if ($http === 404) return 'Modelo ou endereco nao encontrado (HTTP 404).' . ($msg !== '' ? ' ' . $msg : '');
    if ($http === 429) return 'Limite de uso ou saldo do provedor esgotado (HTTP 429).' . ($msg !== '' ? ' ' . $msg : '');
    return 'Falha do provedor (HTTP ' . $http . ').' . ($msg !== '' ? ' ' . $msg : '');
}

/** Executa a chamada. Devolve ['ok' => bool, 'texto' => string, 'erro' => string, 'status' => int]. */
function ia_chama(array $cfg, string $sistema, array $mensagens, int $maxTokens = 1200): array {
    [$url, $cabecalhos, $corpo] = ia_monta_requisicao($cfg, $sistema, $mensagens, $maxTokens);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_HTTPHEADER => $cabecalhos,
        CURLOPT_POSTFIELDS => json_encode($corpo, JSON_UNESCAPED_UNICODE), CURLOPT_TIMEOUT => 60,
        CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    ]);
    $resposta = curl_exec($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resposta === false) return ['ok' => false, 'texto' => '', 'erro' => 'Nao foi possivel conectar ao provedor.', 'status' => 0];
    if ($http >= 400) return ['ok' => false, 'texto' => '', 'erro' => ia_resume_erro($http, (string)$resposta, (string)$cfg['chave']), 'status' => $http];
    $texto = ia_extrai_texto((string)$cfg['provedor'], json_decode((string)$resposta, true) ?: []);
    if ($texto === '') return ['ok' => false, 'texto' => '', 'erro' => 'O provedor respondeu sem texto.', 'status' => $http];
    return ['ok' => true, 'texto' => $texto, 'erro' => '', 'status' => $http];
}

/* ---- persistencia ---- */

function ia_garante_tabela(mysqli $conn): void {
    static $feito = false;
    if ($feito) return;
    $conn->query("CREATE TABLE IF NOT EXISTS ia_config (
        provedor VARCHAR(20) NOT NULL PRIMARY KEY,
        chave_cifrada TEXT NULL,
        chave_final VARCHAR(4) NULL,
        modelo VARCHAR(80) NOT NULL DEFAULT '',
        base_url VARCHAR(200) NULL,
        ativo TINYINT(1) NOT NULL DEFAULT 0,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        atualizado_por INT NULL
    ) CHARACTER SET utf8mb4");
    $feito = true;
}

/** Linhas para a tela: nunca inclui a chave. */
function ia_lista(mysqli $conn): array {
    ia_garante_tabela($conn);
    $guardado = [];
    $r = $conn->query('SELECT provedor, chave_final, modelo, base_url, ativo, atualizado_em FROM ia_config');
    while ($r && ($linha = $r->fetch_assoc())) $guardado[$linha['provedor']] = $linha;
    $lista = [];
    foreach (IA_PROVEDORES as $id => $info) {
        $g = $guardado[$id] ?? null;
        $lista[] = [
            'provedor' => $id, 'rotulo' => $info['rotulo'], 'pede_url' => $info['pede_url'],
            'modelos_sugeridos' => $info['modelos'], 'modelo_padrao' => $info['modelo_padrao'],
            'configurado' => $g !== null && $g['chave_final'] !== null,
            'chave_final' => $g['chave_final'] ?? null, 'modelo' => $g['modelo'] ?? '', 'base_url' => $g['base_url'] ?? null,
            'ativo' => (bool)($g['ativo'] ?? false), 'atualizado_em' => $g['atualizado_em'] ?? null,
        ];
    }
    return $lista;
}

/** Configuracao em uso: a ativa na tela; sem nenhuma, a ANTHROPIC_API_KEY do ambiente. null = sem IA. */
function ia_config_ativa(mysqli $conn): ?array {
    ia_garante_tabela($conn);
    $r = $conn->query("SELECT provedor, chave_cifrada, modelo, base_url FROM ia_config WHERE ativo=1 AND chave_cifrada IS NOT NULL LIMIT 1");
    if ($r && ($linha = $r->fetch_assoc())) {
        $chave = ia_decifra((string)$linha['chave_cifrada']);
        if ($chave !== null && $chave !== '') {
            $info = IA_PROVEDORES[$linha['provedor']] ?? null;
            if ($info) {
                return ['provedor' => $linha['provedor'], 'chave' => $chave, 'base_url' => $linha['base_url'],
                        'modelo' => $linha['modelo'] !== '' ? $linha['modelo'] : $info['modelo_padrao'], 'origem' => 'tela'];
            }
        }
    }
    if (defined('ANTHROPIC_API_KEY') && trim((string)ANTHROPIC_API_KEY) !== '') {
        return ['provedor' => 'anthropic', 'chave' => (string)ANTHROPIC_API_KEY, 'base_url' => null,
                'modelo' => IA_PROVEDORES['anthropic']['modelo_padrao'], 'origem' => 'ambiente'];
    }
    return null;
}
