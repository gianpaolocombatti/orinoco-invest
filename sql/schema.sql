-- ============================================================================
-- Orinoco Invest — Esquema de Base de Datos PostgreSQL
-- ============================================================================
-- Ejecutar: psql -U usuario -d acorns_ve -f schema.sql
-- ============================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tipos Enumerados ───────────────────────────────────────────────────────

CREATE TYPE risk_tolerance AS ENUM ('CONSERVADOR', 'MODERADO', 'AGRESIVO');
CREATE TYPE invest_timeline AS ENUM ('CORTO_PLAZO', 'MEDIANO_PLAZO', 'LARGO_PLAZO');
CREATE TYPE volatility_comfort AS ENUM ('CONSERVADOR', 'MODERADO', 'AGRESIVO');
CREATE TYPE invest_experience AS ENUM ('NINGUNA', 'ALGO', 'MUCHA');
CREATE TYPE portfolio_type AS ENUM ('CONSERVADOR', 'BALANCEADO', 'CRECIMIENTO');
CREATE TYPE asset_class AS ENUM ('BONDS', 'STOCKS', 'GOLD');
CREATE TYPE funding_method_type AS ENUM ('CRYPTO', 'ZELLE', 'PAYPAL', 'BANK_TRANSFER', 'OTHER');
CREATE TYPE deposit_status AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'CANCELLED');
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL', 'REBALANCE', 'FEE', 'DIVIDEND');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- ─── Tabla: users ───────────────────────────────────────────────────────────

CREATE TABLE users (
    id                VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(20) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    ci_passport       VARCHAR(50) NOT NULL,
    date_of_birth     DATE NOT NULL,
    country           VARCHAR(5) DEFAULT 'VE',

    -- Evaluación de riesgo
    risk_tolerance      risk_tolerance,
    invest_timeline     invest_timeline,
    volatility_comfort  volatility_comfort,
    invest_experience   invest_experience,

    -- Onboarding
    onboarding_complete BOOLEAN DEFAULT FALSE,
    tos_accepted        BOOLEAN DEFAULT FALSE,
    tos_accepted_at     TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ─── Tabla: funding_methods ─────────────────────────────────────────────────

CREATE TABLE funding_methods (
    id         VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    user_id    VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       funding_method_type NOT NULL,
    label      VARCHAR(100) NOT NULL,
    details    TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funding_methods_user ON funding_methods(user_id);

-- ─── Tabla: portfolios ──────────────────────────────────────────────────────

CREATE TABLE portfolios (
    id               VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    user_id          VARCHAR(30) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    portfolio_type   portfolio_type NOT NULL,
    total_value_usd  NUMERIC(14,2) DEFAULT 0.00,
    total_cost_basis NUMERIC(14,2) DEFAULT 0.00,
    last_rebalanced  TIMESTAMPTZ,
    alpaca_account_id VARCHAR(100),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tabla: holdings ────────────────────────────────────────────────────────

CREATE TABLE holdings (
    id            VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    portfolio_id  VARCHAR(30) NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_symbol  VARCHAR(20) NOT NULL,
    asset_name    VARCHAR(100) NOT NULL,
    asset_class   asset_class NOT NULL,
    shares        NUMERIC(18,8) DEFAULT 0,
    cost_basis    NUMERIC(14,2) DEFAULT 0.00,
    current_price NUMERIC(14,4) DEFAULT 0.00,
    current_value NUMERIC(14,2) DEFAULT 0.00,
    updated_at    TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(portfolio_id, asset_symbol)
);

CREATE INDEX idx_holdings_portfolio ON holdings(portfolio_id);

-- ─── Tabla: deposits ────────────────────────────────────────────────────────

CREATE TABLE deposits (
    id           VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    user_id      VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usd   NUMERIC(14,2) NOT NULL CHECK (amount_usd >= 5.00),
    fee          NUMERIC(14,2) DEFAULT 0.00,
    net_amount   NUMERIC(14,2) NOT NULL,
    status       deposit_status DEFAULT 'PENDING',
    method       VARCHAR(50) NOT NULL,
    reference    VARCHAR(255),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_deposits_user_status ON deposits(user_id, status);
CREATE INDEX idx_deposits_created ON deposits(created_at DESC);

-- ─── Tabla: withdrawals ─────────────────────────────────────────────────────

CREATE TABLE withdrawals (
    id           VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    user_id      VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usd   NUMERIC(14,2) NOT NULL CHECK (amount_usd > 0),
    fee          NUMERIC(14,2) DEFAULT 0.00,
    net_amount   NUMERIC(14,2) NOT NULL,
    status       withdrawal_status DEFAULT 'PENDING',
    destination  TEXT NOT NULL,
    method       VARCHAR(50) NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_withdrawals_user_status ON withdrawals(user_id, status);

-- ─── Tabla: transactions ────────────────────────────────────────────────────

CREATE TABLE transactions (
    id              VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar(30),
    user_id         VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            transaction_type NOT NULL,
    amount_usd      NUMERIC(14,2) NOT NULL,
    asset           VARCHAR(20),
    shares          NUMERIC(18,8),
    price_per_share NUMERIC(14,4),
    description     TEXT,
    status          transaction_status DEFAULT 'COMPLETED',
    alpaca_order_id VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ─── Función: actualizar updated_at automáticamente ─────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at
    BEFORE UPDATE ON holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Datos de prueba ────────────────────────────────────────────────────────

-- Usuario de prueba (contraseña: "test1234")
INSERT INTO users (id, email, phone, password_hash, first_name, last_name, ci_passport, date_of_birth, risk_tolerance, invest_timeline, volatility_comfort, invest_experience, onboarding_complete, tos_accepted, tos_accepted_at)
VALUES (
    'test_user_001',
    'demo@acorns.ve',
    '+584121234567',
    '$2a$10$XQxKGHqVQx1yGqDqG1234examplehashnotreal',
    'Carlos',
    'Rodríguez',
    'V-12345678',
    '1990-05-15',
    'MODERADO',
    'MEDIANO_PLAZO',
    'MODERADO',
    'ALGO',
    TRUE,
    TRUE,
    NOW()
);

-- Portafolio de prueba
INSERT INTO portfolios (id, user_id, portfolio_type, total_value_usd, total_cost_basis)
VALUES ('test_portfolio_001', 'test_user_001', 'BALANCEADO', 1250.75, 1100.00);

-- Holdings de prueba
INSERT INTO holdings (portfolio_id, asset_symbol, asset_name, asset_class, shares, cost_basis, current_price, current_value)
VALUES
    ('test_portfolio_001', 'BND', 'Vanguard Total Bond ETF', 'BONDS', 6.5, 440.00, 72.50, 471.25),
    ('test_portfolio_001', 'VTI', 'Vanguard Total Stock Market ETF', 'STOCKS', 2.8, 550.00, 235.20, 658.56),
    ('test_portfolio_001', 'GLD', 'SPDR Gold Shares ETF', 'GOLD', 0.6, 110.00, 201.57, 120.94);

-- Transacciones de prueba
INSERT INTO transactions (user_id, type, amount_usd, asset, shares, price_per_share, description, status)
VALUES
    ('test_user_001', 'DEPOSIT', 500.00, NULL, NULL, NULL, 'Depósito inicial vía Zelle', 'COMPLETED'),
    ('test_user_001', 'BUY', 200.00, 'BND', 2.8, 71.43, 'Compra automática - Bonos', 'COMPLETED'),
    ('test_user_001', 'BUY', 250.00, 'VTI', 1.1, 227.27, 'Compra automática - Acciones', 'COMPLETED'),
    ('test_user_001', 'BUY', 50.00, 'GLD', 0.26, 192.31, 'Compra automática - Oro', 'COMPLETED'),
    ('test_user_001', 'DEPOSIT', 600.00, NULL, NULL, NULL, 'Segundo depósito vía crypto', 'COMPLETED'),
    ('test_user_001', 'BUY', 240.00, 'BND', 3.7, 64.86, 'Compra automática - Bonos', 'COMPLETED'),
    ('test_user_001', 'BUY', 300.00, 'VTI', 1.7, 176.47, 'Compra automática - Acciones', 'COMPLETED'),
    ('test_user_001', 'BUY', 60.00, 'GLD', 0.34, 176.47, 'Compra automática - Oro', 'COMPLETED');
