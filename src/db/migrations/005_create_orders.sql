-- 007: SİPARİŞLER
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(30) UNIQUE NOT NULL,
    user_id             UUID NOT NULL REFERENCES users(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
    shipping_name       VARCHAR(150) NOT NULL,
    shipping_phone      VARCHAR(20) NOT NULL,
    shipping_address    TEXT NOT NULL,
    shipping_city       VARCHAR(80) NOT NULL,
    shipping_district   VARCHAR(80),
    shipping_zip        VARCHAR(10),
    cargo_company       VARCHAR(100),
    cargo_tracking_no   VARCHAR(100),
    cargo_updated_at    TIMESTAMPTZ,
    subtotal            NUMERIC(12,2) NOT NULL,
    shipping_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(12,2) NOT NULL,
    paytr_merchant_oid  VARCHAR(50) UNIQUE,
    paytr_payment_type  VARCHAR(30),
    customer_note       TEXT,
    admin_note          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number  ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_oid  ON orders(paytr_merchant_oid);

-- 008: SİPARİŞ KALEMLERİ
CREATE TABLE IF NOT EXISTS order_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name        VARCHAR(255) NOT NULL,
    product_image_url   TEXT,
    selected_width_cm   NUMERIC(7,2),
    selected_height_cm  NUMERIC(7,2),
    quantity            INT NOT NULL,
    unit_price          NUMERIC(12,2) NOT NULL,
    total_price         NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
