-- 005: SEPETLER
CREATE TABLE IF NOT EXISTS cart_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selected_width_cm   NUMERIC(7,2),
    selected_height_cm  NUMERIC(7,2),
    unit_price          NUMERIC(12,2) NOT NULL,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id, selected_width_cm, selected_height_cm)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- 006: FAVORİLER
CREATE TABLE IF NOT EXISTS favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
