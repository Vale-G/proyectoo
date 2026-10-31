ALTER TABLE repair_orders ADD COLUMN intake_data jsonb;
ALTER TABLE repair_orders ADD COLUMN consent jsonb;
ALTER TABLE repair_orders ADD COLUMN initial_status repair_status;
ALTER TABLE repair_orders ADD COLUMN initial_estimate_cents text;
ALTER TABLE repair_orders ADD COLUMN initial_deposit_cents text;
ALTER TABLE repair_orders ADD COLUMN revision integer NOT NULL DEFAULT 0;
ALTER TABLE repair_orders ADD COLUMN public_summary text;
ALTER TABLE repair_orders ADD COLUMN parts_cents text;
ALTER TABLE repair_orders ADD COLUMN parts_description text;
ALTER TABLE repair_orders ADD COLUMN labor_description text;
ALTER TABLE repair_orders ADD COLUMN labor_cents text;
ALTER TABLE repair_orders ADD COLUMN paid_cents text;
ALTER TABLE repair_orders ADD COLUMN approval_reference text;
ALTER TABLE repair_orders ADD COLUMN warranty_until timestamptz;
ALTER TABLE repair_orders ADD COLUMN delivered_at timestamptz;
ALTER TABLE repair_orders ADD COLUMN delivered_to varchar(160);
ALTER TABLE repair_orders ADD COLUMN delivery_accessories text;
CREATE TABLE repair_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  mime_type varchar(32) NOT NULL,
  content text NOT NULL,
  description varchar(300) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CHECK (length(content) <= 2796204)
);
CREATE INDEX repair_photos_order_idx ON repair_photos(order_id, created_at);
DO $$ DECLARE target text; role_name text; BEGIN
  FOREACH target IN ARRAY ARRAY['workshops','customers','devices','repair_orders','repair_order_events','repair_photos'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target);
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON public.%I FROM %I', target, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
