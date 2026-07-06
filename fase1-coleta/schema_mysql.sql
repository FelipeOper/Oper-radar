-- OPER RADAR — Fase 1: Coleta e banco de dados
-- Versão MySQL/MariaDB, para hospedagem compartilhada cPanel (ex: HostGator Plano M).
-- Equivalente ao schema.sql (Postgres) da pasta principal, com os ajustes de sintaxe:
--   SERIAL -> INT AUTO_INCREMENT, TIMESTAMPTZ -> DATETIME, CHECK simplificado,
--   ON CONFLICT -> tratado no código (scraper_hostgator.py) via INSERT ... ON DUPLICATE KEY UPDATE.
-- Requer MySQL 8.0.16+ ou MariaDB 10.2+ para os CHECK constraints funcionarem de verdade
-- (versões mais antigas aceitam a sintaxe mas ignoram o CHECK silenciosamente — se for o
-- caso do seu HostGator, valide o `status` na camada da aplicação, o scraper_hostgator.py já faz isso).

CREATE TABLE revenda (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(255) NOT NULL,
    cidade          VARCHAR(120) NOT NULL,
    uf              CHAR(2) NOT NULL,
    url_perfil      VARCHAR(500) NOT NULL,
    telefone        VARCHAR(30),
    ativa_desde     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ativa           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_revenda_url (url_perfil(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE anuncio (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_portal_id   BIGINT NOT NULL,
    revenda_id          INT NOT NULL,
    url                 VARCHAR(500) NOT NULL,
    titulo              VARCHAR(255) NOT NULL,
    tipo                VARCHAR(60),
    marca               VARCHAR(80),
    modelo              VARCHAR(120),
    ano_inicial         SMALLINT,
    ano_final           SMALLINT,
    cor                 VARCHAR(40),
    km_ou_horas         VARCHAR(40),
    preco               DECIMAL(12,2),
    preco_texto_bruto   VARCHAR(60),
    primeira_vez_visto  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_vez_ativo    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(20) NOT NULL DEFAULT 'ativo'
                          CHECK (status IN ('ativo','removido_candidato','removido_confirmado')),
    data_remocao        DATETIME NULL,
    misses_consecutivos SMALLINT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_anuncio_revenda (revenda_id, anuncio_portal_id),
    CONSTRAINT fk_anuncio_revenda FOREIGN KEY (revenda_id) REFERENCES revenda(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE execucao_coleta (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    revenda_id          INT NULL,
    timestamp           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    janela              VARCHAR(3) NOT NULL CHECK (janela IN ('07h','19h')),
    qtd_anuncios_ativos INT NOT NULL DEFAULT 0,
    hash_pagina         VARCHAR(64),
    pulou_reprocesso    BOOLEAN NOT NULL DEFAULT FALSE,
    sucesso             BOOLEAN NOT NULL DEFAULT TRUE,
    erro_mensagem       TEXT,
    CONSTRAINT fk_execucao_revenda FOREIGN KEY (revenda_id) REFERENCES revenda(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE venda_estimada (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id      INT NOT NULL,
    mes_referencia  DATE NOT NULL,
    dias_no_anuncio INT NOT NULL,
    confianca       VARCHAR(20) NOT NULL DEFAULT 'saida_de_estoque'
                      CHECK (confianca IN ('saida_de_estoque','venda_provavel')),
    CONSTRAINT fk_venda_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_anuncio_status ON anuncio(status);
CREATE INDEX idx_anuncio_revenda ON anuncio(revenda_id);
CREATE INDEX idx_execucao_revenda_ts ON execucao_coleta(revenda_id, timestamp);
