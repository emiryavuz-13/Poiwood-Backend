-- 013: İADE TALEPLERİ
CREATE TABLE IF NOT EXISTS refund_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_id) -- Bir sipariş için sadece bir aktif iade talebi olabilir
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status);

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_refund_requests
        BEFORE UPDATE ON refund_requests
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
