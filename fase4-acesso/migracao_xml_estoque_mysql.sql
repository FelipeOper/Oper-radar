-- OPER RADAR — importacao auditavel de estoque por XML.
-- Para bancos existentes, execute migrar_xml_estoque.php (idempotente).

ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS origem VARCHAR(20) NOT NULL DEFAULT 'manual' AFTER fipe_preco_id;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS origem_chave CHAR(64) CHARACTER SET ascii NULL AFTER origem;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS placa VARCHAR(10) NULL AFTER origem_chave;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS quilometragem INT UNSIGNED NULL AFTER placa;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS url_anuncio VARCHAR(500) NULL AFTER quilometragem;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS imagem_url VARCHAR(500) NULL AFTER url_anuncio;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS usar_comparativo TINYINT(1) NOT NULL DEFAULT 1 AFTER imagem_url;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS xml_importacao_id BIGINT UNSIGNED NULL AFTER usar_comparativo;
ALTER TABLE meu_estoque ADD COLUMN IF NOT EXISTS ultima_sincronizacao DATETIME NULL AFTER xml_importacao_id;

UPDATE meu_estoque
SET origem_chave=SHA2(CONCAT('manual:', id), 256)
WHERE origem_chave IS NULL OR origem_chave='';

CREATE TABLE IF NOT EXISTS meu_estoque_importacao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    arquivo_nome VARCHAR(190) NOT NULL,
    arquivo_hash CHAR(64) CHARACTER SET ascii NOT NULL,
    total_lidos INT NOT NULL DEFAULT 0,
    total_novos INT NOT NULL DEFAULT 0,
    total_atualizados INT NOT NULL DEFAULT 0,
    total_ignorados INT NOT NULL DEFAULT 0,
    total_ausentes INT NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_estoque_importacao_usuario (usuario_id, criado_em),
    CONSTRAINT fk_estoque_importacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- O indice e criado pelo migrador apenas quando ainda nao existe.
