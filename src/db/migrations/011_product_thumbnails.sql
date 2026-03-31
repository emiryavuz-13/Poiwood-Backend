-- Ürün fotoğraflarına thumbnail URL desteği
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
