-- OPER RADAR — Fase 2: referência FIPE
-- Cache local dos dados da API FIPE (fipe.parallelum.com.br) + vínculo com anúncios.
-- Rodar no mesmo banco da Fase 1 (via phpMyAdmin, aba Importar ou SQL).

CREATE TABLE fipe_modelo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'trucks',
    marca_fipe      VARCHAR(80) NOT NULL,
    marca_fipe_id   INT NOT NULL,
    modelo_fipe     VARCHAR(180) NOT NULL,
    modelo_fipe_id  INT NOT NULL,
    UNIQUE KEY uq_fipe_modelo (marca_fipe_id, modelo_fipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fipe_preco (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    fipe_modelo_id  INT NOT NULL,
    ano_codigo      VARCHAR(12) NOT NULL,   -- formato da API, ex: '2022-3' (3 = diesel)
    codigo_fipe     VARCHAR(12),
    preco           DECIMAL(12,2),
    mes_referencia  VARCHAR(40),
    atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fipe_preco (fipe_modelo_id, ano_codigo),
    CONSTRAINT fk_preco_modelo FOREIGN KEY (fipe_modelo_id) REFERENCES fipe_modelo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vínculo anúncio -> preço FIPE (com nível de confiança do match automático)
ALTER TABLE anuncio
    ADD COLUMN fipe_preco_id INT NULL,
    ADD COLUMN fipe_match_confianca VARCHAR(12) NULL,  -- 'alto' | 'medio' (validado na aplicação; MySQL 5.7 ignora CHECK)
    ADD COLUMN fipe_match_status VARCHAR(24) NULL,
    ADD COLUMN fipe_match_motivo VARCHAR(160) NULL,
    ADD COLUMN fipe_ultima_tentativa DATETIME NULL,
    ADD COLUMN fipe_tentativas INT NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_anuncio_fipe FOREIGN KEY (fipe_preco_id) REFERENCES fipe_preco(id);

CREATE INDEX idx_anuncio_fipe ON anuncio(fipe_preco_id);
CREATE INDEX idx_anuncio_fipe_fila ON anuncio(fipe_preco_id, fipe_ultima_tentativa, status, tipo);
