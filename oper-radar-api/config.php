<?php
/**
 * OPER RADAR — configuração compartilhada da API.
 *
 * As credenciais ficam fora do repositorio em .oper-radar.env, com permissao 600.
 * Este arquivo pode permanecer versionado porque nao contem segredos.
 */

function caminhos_env_oper_radar(): array {
    return array_filter(array_unique([
        getenv('OPER_RADAR_ENV_FILE') ?: null,
        (getenv('HOME') ?: '') . '/.oper-radar.env',
        dirname(__DIR__, 2) . '/.oper-radar.env',
        dirname(__DIR__, 3) . '/.oper-radar.env',
    ]));
}

/** Lê uma configuração protegida do ambiente ou do arquivo externo. */
function valor_config_oper_radar(string $chave, $padrao = null) {
    $direto = getenv($chave);
    if ($direto !== false && $direto !== '') return $direto;

    static $arquivos = [];
    foreach (caminhos_env_oper_radar() as $arquivo) {
        if (!array_key_exists($arquivo, $arquivos)) {
            $arquivos[$arquivo] = is_readable($arquivo)
                ? parse_ini_file($arquivo, false, INI_SCANNER_RAW)
                : false;
        }
        $env = $arquivos[$arquivo];
        if (is_array($env) && isset($env[$chave]) && $env[$chave] !== '') {
            return $env[$chave];
        }
    }
    return $padrao;
}

// Chave da API da Anthropic para o Analista IA (analista.php). Lida de .oper-radar.env
// (chave ANTHROPIC_API_KEY), nunca hardcoded aqui — este arquivo é versionado no GitHub
// publico. Deixe ausente/vazia no .env para desativar o Analista.
define('ANTHROPIC_API_KEY', (string) valor_config_oper_radar('ANTHROPIC_API_KEY', ''));

function carrega_config_db(): array {
    $config = [
        'host' => valor_config_oper_radar('OPER_RADAR_DB_HOST', 'localhost'),
        'user' => valor_config_oper_radar('OPER_RADAR_DB_USER'),
        'pass' => valor_config_oper_radar('OPER_RADAR_DB_PASS'),
        'name' => valor_config_oper_radar('OPER_RADAR_DB_NAME'),
    ];
    if ($config['user'] && $config['pass'] && $config['name']) return $config;
    throw new RuntimeException('Configuracao do banco indisponivel');
}

function conecta(): mysqli {
    try {
        $config = carrega_config_db();
    } catch (RuntimeException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['erro' => 'Configuracao do banco indisponivel']);
        exit;
    }

    $conn = new mysqli($config['host'], $config['user'], $config['pass'], $config['name']);
    if ($conn->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['erro' => 'Falha de conexao com o banco']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

/** Resposta JSON privada, sem cache no navegador ou em proxies. */
function envia_json(array $dados): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Sessão própria do Oper Radar, protegida por cookie HttpOnly. */
function inicia_sessao_oper_radar(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('OPER_RADAR_SESSION');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    $agora = time();
    $ultima = (int)($_SESSION['ultima_atividade'] ?? 0);
    if ($ultima && ($agora - $ultima) > 43200) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['ultima_atividade'] = $agora;
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
    }
}

function usuario_atual(): ?array {
    inicia_sessao_oper_radar();
    if (empty($_SESSION['usuario_id'])) return null;
    return [
        'id' => (int)$_SESSION['usuario_id'],
        'nome' => (string)($_SESSION['usuario_nome'] ?? ''),
        'email' => (string)($_SESSION['usuario_email'] ?? ''),
        'papel' => (string)($_SESSION['usuario_papel'] ?? 'visualizador'),
    ];
}

function exige_autenticacao(): array {
    $usuario = usuario_atual();
    if ($usuario) return $usuario;
    http_response_code(401);
    envia_json(['erro' => 'Autenticacao necessaria', 'codigo' => 'NAO_AUTENTICADO']);
}

function exige_csrf(): void {
    inicia_sessao_oper_radar();
    $recebido = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$recebido || !hash_equals((string)($_SESSION['csrf'] ?? ''), (string)$recebido)) {
        http_response_code(403);
        envia_json(['erro' => 'Sessao expirada. Atualize a pagina e tente novamente.', 'codigo' => 'CSRF_INVALIDO']);
    }
}

// Todas as APIs de dados são privadas. auth.php é a única porta pública.
if (PHP_SAPI !== 'cli') {
    $scriptAtual = basename((string)($_SERVER['SCRIPT_NAME'] ?? ''));
    if ($scriptAtual !== 'auth.php') {
        exige_autenticacao();
    }
}
