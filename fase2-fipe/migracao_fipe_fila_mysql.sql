-- OPER RADAR — Fase 2: fila auditavel do matching FIPE
-- Executar uma unica vez em bancos que ja receberam schema_fipe_mysql.sql.

ALTER TABLE anuncio
    ADD COLUMN fipe_match_status VARCHAR(24) NULL AFTER fipe_match_confianca,
    ADD COLUMN fipe_match_motivo VARCHAR(160) NULL AFTER fipe_match_status,
    ADD COLUMN fipe_ultima_tentativa DATETIME NULL AFTER fipe_match_motivo,
    ADD COLUMN fipe_tentativas INT NOT NULL DEFAULT 0 AFTER fipe_ultima_tentativa;

CREATE INDEX idx_anuncio_fipe_fila
    ON anuncio (fipe_preco_id, fipe_ultima_tentativa, status, tipo);

-- Os vinculos existentes continuam validos e passam a ter status explicito.
UPDATE anuncio
SET fipe_match_status = 'vinculado',
    fipe_match_motivo = 'vinculo anterior a fila auditavel'
WHERE fipe_preco_id IS NOT NULL
  AND fipe_match_status IS NULL;
