-- 012: ADRES DEFTERİ
CREATE TABLE IF NOT EXISTS user_addresses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(50) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    address_line    TEXT NOT NULL,
    city            VARCHAR(80) NOT NULL,
    district        VARCHAR(80),
    zip_code        VARCHAR(10),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON user_addresses(user_id);

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_user_addresses
        BEFORE UPDATE ON user_addresses
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
