-- OPER RADAR — controle da referencia mensal FIPE
-- Executar uma unica vez em bancos que ja possuem as tabelas fipe_modelo/fipe_preco.

ALTER TABLE fipe_preco
    ADD COLUMN referencia_codigo INT NULL AFTER mes_referencia;

CREATE INDEX idx_fipe_preco_referencia
    ON fipe_preco (referencia_codigo, atualizado_em);

-- As linhas atuais permanecem validas. Na primeira rodada mensal elas recebem
-- o codigo da referencia publicada pela API, em ordem de uso nos anuncios ativos.
