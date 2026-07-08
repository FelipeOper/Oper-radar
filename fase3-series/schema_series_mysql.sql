-- OPER RADAR — Fase 3: séries temporais e consolidação mensal
-- Rodar no mesmo banco da Fase 1/2

-- Snapshot diário do estado de cada anúncio (materialização histórica).
-- Um job noturno percorre a tabela `anuncio` viva e grava uma linha por anúncio × dia.
CREATE TABLE anuncio_snapshot (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id          INT NOT NULL,
    dia                 DATE NOT NULL,
    preco_do_dia        DECIMAL(12,2),
    status_do_dia       VARCHAR(20) NOT NULL,
    dias_no_ar          SMALLINT,
    UNIQUE KEY uq_snapshot (anuncio_id, dia),
    CONSTRAINT fk_snap_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_snapshot_dia ON anuncio_snapshot(dia);

-- Detecção de mudança de preço (uma linha por queda/aumento detectado)
CREATE TABLE mudanca_preco (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id          INT NOT NULL,
    detectada_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    preco_anterior      DECIMAL(12,2) NOT NULL,
    preco_novo          DECIMAL(12,2) NOT NULL,
    variacao_pct        DECIMAL(6,2) NOT NULL,   -- negativo = queda
    dias_ate_mudanca    SMALLINT,
    CONSTRAINT fk_mp_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_mp_data ON mudanca_preco(detectada_em);
CREATE INDEX idx_mp_anuncio ON mudanca_preco(anuncio_id);

-- Consolidação mensal por marca/modelo/região (pré-calculada para o app)
CREATE TABLE consolidacao_mensal (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    ano_mes             CHAR(7) NOT NULL,        -- '2026-07'
    tipo                VARCHAR(60),
    marca               VARCHAR(80),
    uf                  CHAR(2),
    anuncios_ativos_media    DECIMAL(8,1),
    vendas_confirmadas       INT NOT NULL DEFAULT 0,
    aging_medio_dias         DECIMAL(6,1),
    preco_medio              DECIMAL(12,2),
    preco_mediana            DECIMAL(12,2),
    taxa_giro                DECIMAL(6,3),       -- vendas / estoque médio
    atualizado_em            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_consol (ano_mes, tipo, marca, uf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
