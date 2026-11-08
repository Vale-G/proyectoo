ALTER TABLE public.repair_orders
  ADD COLUMN quote_decision varchar(16),
  ADD COLUMN quote_decided_at timestamptz,
  ADD COLUMN quote_decided_by varchar(160),
  ADD COLUMN warranty_origin_id uuid REFERENCES public.repair_orders(id) ON DELETE SET NULL;

ALTER TABLE public.repair_orders
  ADD CONSTRAINT repair_orders_quote_decision_check
  CHECK (quote_decision IS NULL OR quote_decision IN ('approved','rejected'));

CREATE TABLE public.repair_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  amount_cents text NOT NULL CHECK (amount_cents ~ '^[0-9]+$' AND amount_cents::numeric > 0),
  method varchar(48) NOT NULL,
  note varchar(300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.repair_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  description varchar(300) NOT NULL,
  supplier varchar(160),
  quality varchar(120),
  cost_cents text CHECK (cost_cents IS NULL OR cost_cents ~ '^[0-9]+$'),
  price_cents text CHECK (price_cents IS NULL OR price_cents ~ '^[0-9]+$'),
  warranty_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX repair_payments_order_created_idx ON public.repair_payments(order_id,created_at);
CREATE INDEX repair_parts_order_created_idx ON public.repair_parts(order_id,created_at);
CREATE INDEX repair_orders_warranty_origin_idx ON public.repair_orders(warranty_origin_id);
CREATE INDEX IF NOT EXISTS devices_customer_id_idx ON public.devices(customer_id);
CREATE INDEX IF NOT EXISTS devices_workshop_id_idx ON public.devices(workshop_id);
CREATE INDEX IF NOT EXISTS repair_orders_device_id_idx ON public.repair_orders(device_id);

ALTER TABLE public.repair_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_parts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.repair_payments FROM anon, authenticated;
REVOKE ALL ON TABLE public.repair_parts FROM anon, authenticated;
