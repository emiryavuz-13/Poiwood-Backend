-- Misafir checkout desteği: user_id opsiyonel, guest bilgi alanları eklendi
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name  VARCHAR(150);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20);

-- Constraint: Ya user_id ya da guest bilgileri olmalı
ALTER TABLE orders ADD CONSTRAINT chk_order_owner
  CHECK (user_id IS NOT NULL OR (guest_email IS NOT NULL AND guest_name IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;
