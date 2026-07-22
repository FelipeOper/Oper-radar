<?php
/**
 * OPER RADAR — Fase 1 (versão PHP para HostGator Plano M, sem Python/terminal disponível)
 *
 * Usa cURL (já vem pronto no HostGator) e MySQLi (idem) — não precisa instalar nada.
 * Roda via Tarefas Cron do cPanel, lendo as credenciais de variaveis de ambiente.
 *
 * Uso: set -a; . /home/SEUUSUARIO/.oper-radar.env; set +a; php scraper.php --janela=07h --uf=PR
 */
require_once __DIR__ . '/parser.php';
require_once __DIR__ . '/diff_logic.php';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE_URL = 'https://www.caminhoesecarretas.com.br';
// Os links no HTML real sao RELATIVOS (sem dominio, sem barra inicial) — confirmado
// via curl+grep direto no servidor de producao.
const LOJA_URL_RE = '/href="([a-z0-9-]+\/[a-z]{2}\/loja\/[a-z0-9-]+\/veiculo\/\d+)"/';

// Pausa entre cada revenda visitada. Plano compartilhado tem limite de 25% de CPU por
// períodos >=90s — rodar devagar evita estourar isso (e é mais gentil com o portal).
const PAUSA_ENTRE_REQUISICOES_SEGUNDOS = 2;

function http_get(string $url): string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERAGENT => USER_AGENT,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $resp = curl_exec($ch);
    if ($resp === false) {
        throw new RuntimeException('cURL error: ' . curl_error($ch));
    }
    curl_close($ch);
    return $resp;
}

function discover_revenda_urls(string $uf): array {
    $html = http_get("https://www.caminhoesecarretas.com.br/revendas.aspx?uf={$uf}");
    preg_match_all(LOJA_URL_RE, $html, $matches);
    $caminhos = array_values(array_unique($matches[1]));
    return array_map(fn($c) => BASE_URL . '/' . $c, $caminhos);
}

function get_or_create_revenda(mysqli $conn, string $nome, string $cidade, string $uf, string $url_perfil): int {
    $stmt = $conn->prepare('SELECT id FROM revenda WHERE url_perfil = ?');
    $stmt->bind_param('s', $url_perfil);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($res) {
        return (int) $res['id'];
    }
    $stmt = $conn->prepare('INSERT INTO revenda (nome, cidade, uf, url_perfil) VALUES (?,?,?,?)');
    $stmt->bind_param('ssss', $nome, $cidade, $uf, $url_perfil);
    $stmt->execute();
    $novo_id = $conn->insert_id;
    $stmt->close();
    return $novo_id;
}

function carrega_estado_atual(mysqli $conn, int $revenda_id): array {
    $estado = [];
    $stmt = $conn->prepare(
        'SELECT anuncio_portal_id, status, misses_consecutivos, primeira_vez_visto, ' .
        'ultima_vez_ativo, data_remocao FROM anuncio WHERE revenda_id = ?'
    );
    $stmt->bind_param('i', $revenda_id);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $estado[(int) $row['anuncio_portal_id']] = [
            'status' => $row['status'],
            'misses_consecutivos' => (int) $row['misses_consecutivos'],
            'primeira_vez_visto' => $row['primeira_vez_visto'],
            'ultima_vez_ativo' => $row['ultima_vez_ativo'],
            'data_remocao' => $row['data_remocao'],
        ];
    }
    $stmt->close();
    return $estado;
}

function salva_estado(mysqli $conn, int $revenda_id, array $novo_estado, array $anuncios_por_id): void {
    $sqlInsert = "INSERT INTO anuncio (anuncio_portal_id, revenda_id, url, titulo, tipo, marca,
                ano_inicial, ano_final, km_ou_horas, preco, preco_texto_bruto,
                primeira_vez_visto, ultima_vez_ativo, status, misses_consecutivos, data_remocao)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                ultima_vez_ativo = VALUES(ultima_vez_ativo),
                status = VALUES(status),
                misses_consecutivos = VALUES(misses_consecutivos),
                data_remocao = VALUES(data_remocao),
                ano_inicial = COALESCE(VALUES(ano_inicial), ano_inicial),
                ano_final = COALESCE(VALUES(ano_final), ano_final),
                km_ou_horas = COALESCE(NULLIF(VALUES(km_ou_horas), ''), km_ou_horas),
                preco = COALESCE(VALUES(preco), preco)";
    $stmtInsert = $conn->prepare($sqlInsert);

    $sqlUpdateOnly = "UPDATE anuncio SET
                ultima_vez_ativo = ?, status = ?, misses_consecutivos = ?, data_remocao = ?
            WHERE revenda_id = ? AND anuncio_portal_id = ?";
    $stmtUpdate = $conn->prepare($sqlUpdateOnly);

    foreach ($novo_estado as $anuncio_id => $estado) {
        $a = $anuncios_por_id[$anuncio_id] ?? null;

        if ($a !== null) {
            // Anúncio visto nesta coleta — grava tudo.
            $url = $a['url'];
            $titulo = $a['titulo'];
            $tipo = $a['tipo'];
            $marca = $a['marca'];
            $anoInicial = $a['ano_inicial'];
            $anoFinal = $a['ano_final'];
            $preco = $a['preco'];
            $precoTexto = $a['preco_texto_bruto'];
            $kmOuHoras = $a['km_ou_horas'];

            $stmtInsert->bind_param(
                'iissssiisdssssis',
                $anuncio_id, $revenda_id, $url, $titulo, $tipo, $marca,
                $anoInicial, $anoFinal, $kmOuHoras, $preco, $precoTexto,
                $estado['primeira_vez_visto'], $estado['ultima_vez_ativo'], $estado['status'],
                $estado['misses_consecutivos'], $estado['data_remocao']
            );
            $stmtInsert->execute();
        } else {
            // Anúncio que já existia e sumiu desta coleta — só atualiza o status,
            // não mexe em url/titulo/preço (evita violar NOT NULL).
            $stmtUpdate->bind_param(
                'ssisi',
                $estado['ultima_vez_ativo'], $estado['status'], $estado['misses_consecutivos'],
                $estado['data_remocao'], $revenda_id, $anuncio_id
            );
            $stmtUpdate->execute();
        }
    }
    $stmtInsert->close();
    $stmtUpdate->close();
}

function registra_execucao(mysqli $conn, ?int $revenda_id, string $janela, int $qtd_ativos, string $hash, bool $sucesso, ?string $erro = null): void {
    $stmt = $conn->prepare(
        'INSERT INTO execucao_coleta (revenda_id, janela, qtd_anuncios_ativos, hash_pagina, sucesso, erro_mensagem) VALUES (?,?,?,?,?,?)'
    );
    $stmt->bind_param('isissi', $revenda_id, $janela, $qtd_ativos, $hash, $sucesso, $erro);
    $stmt->execute();
    $stmt->close();
}

function roda_ciclo(mysqli $conn, string $uf, string $janela, array $marcas_conhecidas): void {
    $urls = discover_revenda_urls($uf);
    $total = count($urls);
    echo "[{$uf}] {$total} revendas encontradas — pausa de " . PAUSA_ENTRE_REQUISICOES_SEGUNDOS . "s entre cada uma\n";

    foreach ($urls as $i => $url) {
        try {
            $html = http_get($url);
        } catch (RuntimeException $e) {
            registra_execucao($conn, null, $janela, 0, '', false, $e->getMessage());
            sleep(PAUSA_ENTRE_REQUISICOES_SEGUNDOS);
            continue;
        }

        $hash = hash_pagina($html);
        $partesLoja = explode('/loja/', $url);
        $nomeRevenda = ucwords(str_replace(['%20', '-'], [' ', ' '], explode('/', $partesLoja[1])[0]));
        $cidade = ucwords(str_replace('-', ' ', explode('/', $url)[3]));
        $revendaId = get_or_create_revenda($conn, $nomeRevenda, $cidade, strtoupper($uf), $url);

        $anuncios = parse_listings($html, $marcas_conhecidas);
        $anunciosPorId = [];
        foreach ($anuncios as $a) {
            $anunciosPorId[$a['anuncio_portal_id']] = $a;
        }
        $idsAtivos = array_keys($anunciosPorId);

        $estadoAnterior = carrega_estado_atual($conn, $revendaId);
        $agora = date('Y-m-d H:i:s');
        $novoEstado = processa_diff($estadoAnterior, $idsAtivos, $agora);
        salva_estado($conn, $revendaId, $novoEstado, $anunciosPorId);

        registra_execucao($conn, $revendaId, $janela, count($idsAtivos), $hash, true);
        printf("  [%d/%d] %s: %d anúncios ativos\n", $i + 1, $total, $nomeRevenda, count($idsAtivos));

        if ($i < $total - 1) {
            sleep(PAUSA_ENTRE_REQUISICOES_SEGUNDOS);
        }
    }
}

// ---- CLI entry point ----
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $opts = getopt('', ['janela:', 'uf::', 'db-host::', 'db-user::', 'db-pass::', 'db-name::']);

    $janela = $opts['janela'] ?? null;
    if (!in_array($janela, ['07h', '19h'], true)) {
        fwrite(STDERR, "Uso: php scraper.php --janela=07h|19h --uf=PR (credenciais via OPER_RADAR_DB_*)\n");
        exit(1);
    }
    $uf = $opts['uf'] ?? 'PR';
    $dbHost = $opts['db-host'] ?? (getenv('OPER_RADAR_DB_HOST') ?: 'localhost');
    $dbUser = $opts['db-user'] ?? (getenv('OPER_RADAR_DB_USER') ?: null);
    $dbPass = $opts['db-pass'] ?? (getenv('OPER_RADAR_DB_PASS') ?: null);
    $dbName = $opts['db-name'] ?? (getenv('OPER_RADAR_DB_NAME') ?: null);

    if (!$dbUser || !$dbPass || !$dbName) {
        fwrite(STDERR, "Faltam OPER_RADAR_DB_USER, OPER_RADAR_DB_PASS ou OPER_RADAR_DB_NAME\n");
        exit(1);
    }

    $conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
    if ($conn->connect_error) {
        fwrite(STDERR, "Erro de conexão MySQL: {$conn->connect_error}\n");
        exit(1);
    }
    $conn->set_charset('utf8mb4');

    $marcas = carrega_marcas_conhecidas();
    roda_ciclo($conn, $uf, $janela, $marcas);
    $conn->close();
}
