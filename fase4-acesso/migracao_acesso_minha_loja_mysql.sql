-- OPER RADAR — autenticação e estoque próprio por usuário
CREATE TABLE IF NOT EXISTS usuario (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    nome             VARCHAR(120) NOT NULL,
    email            VARCHAR(190) NOT NULL,
    senha_hash       VARCHAR(255) NOT NULL,
    papel            VARCHAR(24) NOT NULL DEFAULT 'visualizador',
    ativo            TINYINT(1) NOT NULL DEFAULT 1,
    tentativas_login SMALLINT NOT NULL DEFAULT 0,
    bloqueado_ate    DATETIME NULL,
    ultimo_login     DATETIME NULL,
    criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuario_email (email),
    KEY idx_usuario_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meu_estoque (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id         INT NOT NULL,
    referencia_interna VARCHAR(80) NULL,
    marca              VARCHAR(80) NULL,
    modelo             VARCHAR(180) NOT NULL,
    ano                SMALLINT NULL,
    preco_anunciado    DECIMAL(12,2) NULL,
    cidade             VARCHAR(120) NULL,
    uf                 CHAR(2) NULL,
    data_entrada       DATE NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'estoque',
    fipe_preco_id      INT NULL,
    criado_em          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_meu_estoque_usuario_status (usuario_id, status),
    KEY idx_meu_estoque_fipe (fipe_preco_id),
    CONSTRAINT fk_meu_estoque_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_meu_estoque_fipe FOREIGN KEY (fipe_preco_id) REFERENCES fipe_preco(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
