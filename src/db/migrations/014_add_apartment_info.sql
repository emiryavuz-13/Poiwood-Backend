-- Posta kodu yerine apartman/daire bilgisi
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_apartment VARCHAR(150);
ALTER TABLE orders ALTER COLUMN shipping_zip DROP NOT NULL;

-- Mevcut siparişlere varsayılan değer
UPDATE orders SET shipping_apartment = 'x' WHERE shipping_apartment IS NULL;

-- NOT NULL yap
ALTER TABLE orders ALTER COLUMN shipping_apartment SET NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_apartment SET DEFAULT 'x';
