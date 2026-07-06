-- OPER RADAR — Fase 1: Coleta e banco de dados
-- Postgres 14+

CREATE TABLE revenda (
    id              SERIAL PRIMARY KEY,
    nome            TEXT NOT NULL,
    cidade          TEXT NOT NULL,
    uf              CHAR(2) NOT NULL,
    url_perfil      TEXT NOT NULL UNIQUE,       -- URL real do perfil no portal (descoberta pelo crawler, nao adivinhada)
    telefone        TEXT,
    ativa_desde     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ativa           BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE anuncio (
    id                  SERIAL PRIMARY KEY,
    anuncio_portal_id   BIGINT NOT NULL,          -- ID numerico do anuncio extraido da URL (ex: 1348833)
    revenda_id          INTEGER NOT NULL REFERENCES revenda(id),
    url                 TEXT NOT NULL,
    titulo              TEXT NOT NULL,
    tipo                TEXT,                     -- Caminhao / Carreta / Implemento / Trator / Van / etc
    marca               TEXT,
    modelo              TEXT,
    ano_inicial         SMALLINT,
    ano_final           SMALLINT,
    cor                 TEXT,
    km_ou_horas         TEXT,
    preco               NUMERIC(12,2),            -- NULL quando "(A consultar)"
    preco_texto_bruto   TEXT,                     -- valor original, para auditoria
    primeira_vez_visto  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_vez_ativo    TIMESTAMPTZ NOT NULL DEFAULT now(),
    status              TEXT NOT NULL DEFAULT 'ativo'
                          CHECK (status IN ('ativo','removido_candidato','removido_confirmado')),
    data_remocao        TIMESTAMPTZ,
    misses_consecutivos SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (revenda_id, anuncio_portal_id)
);

CREATE TABLE execucao_coleta (
    id                  SERIAL PRIMARY KEY,
    revenda_id          INTEGER NOT NULL REFERENCES revenda(id),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),
    janela              TEXT NOT NULL CHECK (janela IN ('07h','19h')),
    qtd_anuncios_ativos INTEGER NOT NULL,
    hash_pagina         TEXT NOT NULL,
    pulou_reprocesso    BOOLEAN NOT NULL DEFAULT false,   -- true quando hash igual ao anterior
    sucesso             BOOLEAN NOT NULL DEFAULT true,
    erro_mensagem       TEXT
);

CREATE TABLE venda_estimada (
    id              SERIAL PRIMARY KEY,
    anuncio_id      INTEGER NOT NULL REFERENCES anuncio(id),
    mes_referencia  DATE NOT NULL,             -- primeiro dia do mes de fechamento
    dias_no_anuncio INTEGER NOT NULL,
    confianca       TEXT NOT NULL DEFAULT 'saida_de_estoque'
                      CHECK (confianca IN ('saida_de_estoque','venda_provavel'))
);

CREATE INDEX idx_anuncio_status ON anuncio(status);
CREATE INDEX idx_anuncio_revenda ON anuncio(revenda_id);
CREATE INDEX idx_execucao_revenda_ts ON execucao_coleta(revenda_id, timestamp);
