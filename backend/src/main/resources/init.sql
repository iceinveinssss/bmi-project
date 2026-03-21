-- Скрипт инициализации базы данных
-- Запустить: psql -U postgres -d bmi_db -f init.sql

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    birth_year  INTEGER,
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS bmi_records (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight      DOUBLE PRECISION NOT NULL,
    height      DOUBLE PRECISION NOT NULL,
    bmi         DOUBLE PRECISION NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    measured_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bmi_records_user_id ON bmi_records(user_id);
CREATE INDEX idx_bmi_records_measured_at ON bmi_records(measured_at DESC);

-- Тестовый администратор (пароль: admin123)
INSERT INTO users (email, password, name, role) VALUES
('admin@bmi.ru', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Администратор', 'ADMIN')
ON CONFLICT DO NOTHING;
