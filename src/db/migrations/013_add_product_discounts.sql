-- Ürün indirimleri
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2);

-- Mevcut ürünlerin sale_price'ını base_price ile eşitle
UPDATE products SET sale_price = base_price WHERE sale_price IS NULL;
