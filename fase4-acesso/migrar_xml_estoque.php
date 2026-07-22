<?php
/** Migra com seguranca um banco existente para aceitar estoque em XML. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../oper-radar-api/config.php';
$conn = conecta();

function coluna_existe(mysqli $conn, string $tabela, string $coluna): bool {
    $st = $conn->prepare('SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?');
    $st->bind_param('ss', $tabela, $coluna); $st->execute();
    $ok = (int)$st->get_result()->fetch_assoc()['n'] > 0; $st->close();
    return $ok;
}

$colunas = [
    'origem' => "VARCHAR(20) NOT NULL DEFAULT 'manual' AFTER fipe_preco_id",
    'origem_chave' => 'CHAR(64) CHARACTER SET ascii NULL AFTER origem',
    'placa' => 'VARCHAR(10) NULL AFTER origem_chave',
    'quilometragem' => 'INT UNSIGNED NULL AFTER placa',
    'url_anuncio' => 'VARCHAR(500) NULL AFTER quilometragem',
    'imagem_url' => 'VARCHAR(500) NULL AFTER url_anuncio',
    'usar_comparativo' => 'TINYINT(1) NOT NULL DEFAULT 1 AFTER imagem_url',
    'xml_importacao_id' => 'BIGINT UNSIGNED NULL AFTER usar_comparativo',
    'ultima_sincronizacao' => 'DATETIME NULL AFTER xml_importacao_id',
];
foreach ($colunas as $nome => $definicao) {
    if (!coluna_existe($conn, 'meu_estoque', $nome)) {
        if (!$conn->query("ALTER TABLE meu_estoque ADD COLUMN $nome $definicao")) throw new RuntimeException($conn->error);
        echo "Coluna $nome: criada\n";
    }
}

if (!$conn->query("UPDATE meu_estoque SET origem_chave=SHA2(CONCAT('manual:',id),256) WHERE origem_chave IS NULL OR origem_chave=''")) throw new RuntimeException($conn->error);
if (!$conn->query("CREATE TABLE IF NOT EXISTS meu_estoque_importacao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id INT NOT NULL,
    arquivo_nome VARCHAR(190) NOT NULL, arquivo_hash CHAR(64) CHARACTER SET ascii NOT NULL,
    total_lidos INT NOT NULL DEFAULT 0, total_novos INT NOT NULL DEFAULT 0,
    total_atualizados INT NOT NULL DEFAULT 0, total_ignorados INT NOT NULL DEFAULT 0,
    total_ausentes INT NOT NULL DEFAULT 0, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_estoque_importacao_usuario (usuario_id, criado_em),
    CONSTRAINT fk_estoque_importacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) throw new RuntimeException($conn->error);

$indice = $conn->query("SELECT COUNT(*) n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='meu_estoque' AND INDEX_NAME='uq_meu_estoque_origem'")->fetch_assoc();
if ((int)$indice['n'] === 0 && !$conn->query('ALTER TABLE meu_estoque ADD UNIQUE KEY uq_meu_estoque_origem (usuario_id, origem, origem_chave)')) throw new RuntimeException($conn->error);
echo "Importacao XML do estoque: banco preparado.\n";
