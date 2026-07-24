-- OPER RADAR — coleta da página de detalhe do anúncio (Cor, Carroceria, Tração, Opcionais, Descrição)
-- Execute somente depois de criar um backup do banco.
-- `modelo` e `cor` já existem em schema_mysql.sql — só passam a ser preenchidos, sem ALTER aqui.
--
-- AVISO: este arquivo NÃO é idempotente (ALTER TABLE avulso) — rodar duas vezes falha com
-- "Duplicate column name". Preferir `python3 migrar_detalhe_anuncio.py`, que checa cada coluna/
-- índice antes de alterar e pode ser executado quantas vezes for preciso. Este .sql fica só
-- como referência do formato final do schema.

ALTER TABLE anuncio
    ADD COLUMN carroceria               VARCHAR(60)  NULL AFTER cor,
    ADD COLUMN tracao                   VARCHAR(30)  NULL AFTER carroceria,
    ADD COLUMN opcionais                TEXT         NULL AFTER tracao,
    ADD COLUMN descricao                TEXT         NULL AFTER opcionais,
    ADD COLUMN detalhe_status           VARCHAR(20)  NULL AFTER descricao,
    ADD COLUMN detalhe_ultima_tentativa DATETIME     NULL AFTER detalhe_status,
    ADD COLUMN detalhe_tentativas       SMALLINT NOT NULL DEFAULT 0 AFTER detalhe_ultima_tentativa,
    ADD COLUMN detalhe_coletado_em      DATETIME     NULL AFTER detalhe_tentativas;

CREATE INDEX idx_anuncio_detalhe_fila ON anuncio (detalhe_coletado_em, detalhe_ultima_tentativa, status);
