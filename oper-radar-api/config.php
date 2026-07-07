<?php
/**
 * OPER RADAR — Fase 7 (ponte entre o banco e o app)
 * Configuração de conexão compartilhada pelos endpoints da API.
 *
 * IMPORTANTE: preencha os 3 valores abaixo com os dados reais do seu banco
 * (os mesmos que você já usa no scraper_hostgator.py). Depois de preencher,
 * NÃO deixe este arquivo dentro de public_html acessível diretamente — coloque-o
 * junto dos outros arquivos da API numa pasta própria (ex: /oper-radar-api/).
 */
function conecta(): mysqli {
    $host = 'localhost';
    $user = 'pro93061_pro93061';       // mesmo usuário do scraper
    $pass = 'SUA_SENHA_AQUI';          // mesma senha do scraper
    $name = 'pro93061_radar_oper';     // mesmo banco do scraper

    $conn = new mysqli($host, $user, $pass, $name);
    if ($conn->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['erro' => 'Falha de conexão com o banco']);
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
