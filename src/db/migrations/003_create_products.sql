-- 003: ÜRÜNLER
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id         UUID NOT NULL REFERENCES categories(id),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(270) UNIQUE NOT NULL,
    description         TEXT,
    pricing_type        VARCHAR(20) NOT NULL DEFAULT 'fixed'
                        CHECK (pricing_type IN ('fixed', 'per_cm2', 'formula')),
    base_price          NUMERIC(12,2),
    price_per_cm2       NUMERIC(12,4),
    formula_json        JSONB,
    min_width_cm        NUMERIC(7,2),
    max_width_cm        NUMERIC(7,2),
    min_height_cm       NUMERIC(7,2),
    max_height_cm       NUMERIC(7,2),
    stock_quantity      INT NOT NULL DEFAULT 0,
    is_featured         BOOLEAN NOT NULL DEFAULT false,
    is_weekly_pick      BOOLEAN NOT NULL DEFAULT false,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug         ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured  ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_weekly    ON products(is_weekly_pick) WHERE is_weekly_pick = true;

-- 004: ÜRÜN FOTOĞRAFLARI
CREATE TABLE IF NOT EXISTS product_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    firebase_url    TEXT NOT NULL,
    storage_path    TEXT NOT NULL,
    display_order   INT NOT NULL DEFAULT 0,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
