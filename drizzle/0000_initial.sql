CREATE TYPE repair_status AS ENUM ('received', 'diagnosing', 'awaiting_approval', 'awaiting_deposit', 'awaiting_part', 'repairing', 'testing', 'ready_for_pickup', 'delivered', 'not_repaired', 'under_warranty');

CREATE TABLE workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  public_name varchar(120) NOT NULL,
  whatsapp varchar(32),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  full_name varchar(160) NOT NULL,
  phone varchar(32) NOT NULL,
  email varchar(254),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  category varchar(48) NOT NULL,
  brand varchar(80),
  model varchar(120) NOT NULL,
  color varchar(48),
  serial_number varchar(128),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
  order_number varchar(24) NOT NULL,
  public_token varchar(96) NOT NULL UNIQUE,
  status repair_status NOT NULL DEFAULT 'received',
  reported_issue text NOT NULL,
  intake_condition text,
  accessories text,
  diagnosis text,
  proposed_solution text,
  estimate_cents text,
  deposit_cents text,
  estimated_completion timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, order_number)
);

CREATE TABLE repair_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  from_status repair_status,
  to_status repair_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customers_workshop_phone_idx ON customers(workshop_id, phone);
CREATE INDEX repair_orders_workshop_status_idx ON repair_orders(workshop_id, status);
CREATE INDEX repair_order_events_order_idx ON repair_order_events(order_id, created_at DESC);
