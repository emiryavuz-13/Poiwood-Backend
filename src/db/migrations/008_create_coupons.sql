CREATE TABLE IF NOT EXISTS coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE,
    discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_amount NUMERIC(10,2) NOT NULL,
    min_cart_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_uses        INT, -- NULL ise sınırsız kullanım
    used_count      INT NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ, -- NULL ise süresiz
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Siparişler tablosuna kupon bilgilerini ekleyelim
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_coupons
        BEFORE UPDATE ON coupons
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
