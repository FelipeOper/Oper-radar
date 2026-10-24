-- OPER RADAR — Fase 2: atributos do catálogo FIPE e assinatura de vínculo
-- Referência de formato. NÃO é idempotente: rode migrar_fipe_assinatura.py, que confere
-- cada tabela e coluna antes de criar.

CREATE TABLE fipe_modelo_atributo (
    fipe_modelo_id INT NOT NULL PRIMARY KEY,
    marca_fipe     VARCHAR(80) NOT NULL,
    familia        VARCHAR(40) NULL,
    numero         VARCHAR(16) NULL,
    serie          VARCHAR(8)  NULL,
    geracao        VARCHAR(12) NULL,
    eixo           VARCHAR(4)  NULL,
    emissao        VARCHAR(2)  NULL,
    cabine         VARCHAR(24) NULL,
    cambio         VARCHAR(24) NULL,
    KEY idx_fma_grupo (marca_fipe, familia, numero),
    CONSTRAINT fk_fma_modelo FOREIGN KEY (fipe_modelo_id) REFERENCES fipe_modelo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fipe_assinatura (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    hash_assinatura     CHAR(40) NOT NULL,
    marca               VARCHAR(40) NOT NULL,
    familia             VARCHAR(40) NOT NULL,
    numero              VARCHAR(16) NOT NULL,
    ano_modelo          SMALLINT NOT NULL,
    dims_discriminantes VARCHAR(80) NOT NULL,
    valores             VARCHAR(200) NOT NULL,
    fipe_preco_id       INT NOT NULL,
    origem              VARCHAR(12) NOT NULL,
    status              VARCHAR(12) NOT NULL DEFAULT 'ativa',
    evidencias          INT NOT NULL DEFAULT 1,
    criado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_assinatura_hash (hash_assinatura),
    KEY idx_assinatura_preco (fipe_preco_id),
    CONSTRAINT fk_assinatura_preco FOREIGN KEY (fipe_preco_id) REFERENCES fipe_preco(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE anuncio
    ADD COLUMN fipe_assinatura_id INT NULL,
    ADD COLUMN fipe_regra_versao SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN conjunto TINYINT NULL,
    ADD COLUMN conjunto_origem VARCHAR(12) NULL;

CREATE TABLE fipe_auditoria (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id    INT NOT NULL,
    fipe_preco_id INT NOT NULL,
    veredito      VARCHAR(10) NOT NULL,
    observacao    VARCHAR(300) NULL,
    usuario_id    INT NULL,
    criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_auditoria (anuncio_id, fipe_preco_id),
    KEY idx_auditoria_preco (fipe_preco_id, veredito),
    CONSTRAINT fk_auditoria_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
