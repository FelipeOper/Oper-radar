-- OPER RADAR — curadoria manual de FIPE e quilometragem dos anúncios
-- Execute somente depois de criar um backup do banco.

ALTER TABLE anuncio
    ADD COLUMN fipe_preco_automatico_id INT NULL AFTER fipe_preco_id,
    ADD COLUMN fipe_match_status_automatico VARCHAR(24) NULL AFTER fipe_match_status,
    ADD COLUMN fipe_match_confianca_automatico VARCHAR(20) NULL AFTER fipe_match_confianca,
    ADD COLUMN fipe_match_motivo_automatico VARCHAR(160) NULL AFTER fipe_match_motivo,
    ADD COLUMN fipe_vinculo_origem VARCHAR(16) NOT NULL DEFAULT 'automatico' AFTER fipe_match_motivo_automatico,
    ADD COLUMN quilometragem_manual INT UNSIGNED NULL AFTER km_ou_horas,
    ADD COLUMN curadoria_observacao VARCHAR(500) NULL AFTER quilometragem_manual,
    ADD COLUMN curadoria_usuario_id INT NULL AFTER curadoria_observacao,
    ADD COLUMN curadoria_atualizada_em DATETIME NULL AFTER curadoria_usuario_id;

CREATE INDEX idx_anuncio_fipe_automatico ON anuncio (fipe_preco_automatico_id);
CREATE INDEX idx_anuncio_curadoria_usuario ON anuncio (curadoria_usuario_id);

CREATE TABLE IF NOT EXISTS anuncio_curadoria_log (
    id                         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    anuncio_id                 INT NOT NULL,
    usuario_id                 INT NOT NULL,
    acao                       VARCHAR(32) NOT NULL,
    fipe_preco_anterior_id     INT NULL,
    fipe_preco_novo_id         INT NULL,
    quilometragem_anterior     VARCHAR(40) NULL,
    quilometragem_nova         VARCHAR(40) NULL,
    observacao                 VARCHAR(500) NULL,
    criado_em                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_curadoria_anuncio_data (anuncio_id, criado_em),
    KEY idx_curadoria_usuario_data (usuario_id, criado_em),
    CONSTRAINT fk_curadoria_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id) ON DELETE CASCADE,
    CONSTRAINT fk_curadoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS anuncio_fipe_sugestao (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    anuncio_id      INT NOT NULL,
    fipe_preco_id   INT NOT NULL,
    posicao         TINYINT UNSIGNED NOT NULL,
    score           TINYINT UNSIGNED NOT NULL,
    confianca       VARCHAR(12) NOT NULL,
    motivos         VARCHAR(255) NOT NULL,
    atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sugestao_anuncio_preco (anuncio_id, fipe_preco_id),
    KEY idx_sugestao_anuncio_posicao (anuncio_id, posicao),
    CONSTRAINT fk_sugestao_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id) ON DELETE CASCADE,
    CONSTRAINT fk_sugestao_preco FOREIGN KEY (fipe_preco_id) REFERENCES fipe_preco(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
