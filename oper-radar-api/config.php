<?php
/**
 * OPER RADAR — configuração compartilhada da API.
 *
 * As credenciais ficam fora do repositorio em .oper-radar.env, com permissao 600.
 * Este arquivo pode permanecer versionado porque nao contem segredos.
 */

// Chave da API da Anthropic para o Analista IA (analista.php).
// Deixe vazia para desativar o Analista.
define('ANTHROPIC_API_KEY', '');

function carrega_config_db(): array {
    $direto = [
        'host' => getenv('OPER_RADAR_DB_HOST') ?: 'localhost',
        'user' => getenv('OPER_RADAR_DB_USER') ?: null,
        'pass' => getenv('OPER_RADAR_DB_PASS') ?: null,
        'name' => getenv('OPER_RADAR_DB_NAME') ?: null,
    ];
    if ($direto['user'] && $direto['pass'] && $direto['name']) {
        return $direto;
    }

    $candidatos = array_filter(array_unique([
        getenv('OPER_RADAR_ENV_FILE') ?: null,
        (getenv('HOME') ?: '') . '/.oper-radar.env',
        dirname(__DIR__, 2) . '/.oper-radar.env',
        dirname(__DIR__, 3) . '/.oper-radar.env',
    ]));
    foreach ($candidatos as $arquivo) {
        if (!is_readable($arquivo)) continue;
        $env = parse_ini_file($arquivo, false, INI_SCANNER_RAW);
        if (!is_array($env)) continue;
        $config = [
            'host' => $env['OPER_RADAR_DB_HOST'] ?? 'localhost',
            'user' => $env['OPER_RADAR_DB_USER'] ?? null,
            'pass' => $env['OPER_RADAR_DB_PASS'] ?? null,
            'name' => $env['OPER_RADAR_DB_NAME'] ?? null,
        ];
        if ($config['user'] && $config['pass'] && $config['name']) {
            return $config;
        }
    }
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

/** Cabeçalhos padrão de toda resposta da API — JSON + CORS liberado pro app buscar dados. */
function envia_json(array $dados): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}
