-- Additive migration. Assign existing workshops only after verifying operator identity.
CREATE TYPE workshop_member_role AS ENUM ('owner','admin','technician','reception');
CREATE TABLE workshop_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL,
 role workshop_member_role NOT NULL,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workshop_id,user_id)
);
CREATE INDEX workshop_members_user_idx ON workshop_members(user_id) WHERE active;
ALTER TABLE workshop_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON workshop_members FROM PUBLIC,anon,authenticated;

-- Validate old rows before enabling relational constraints. No automatic repair.
ALTER TABLE customers ADD CONSTRAINT customers_workshop_identity UNIQUE(workshop_id,id);
ALTER TABLE devices ADD CONSTRAINT devices_workshop_identity UNIQUE(workshop_id,id);
ALTER TABLE devices ADD CONSTRAINT devices_customer_tenant FOREIGN KEY(workshop_id,customer_id) REFERENCES customers(workshop_id,id) NOT VALID;
ALTER TABLE repair_orders ADD CONSTRAINT orders_device_tenant FOREIGN KEY(workshop_id,device_id) REFERENCES devices(workshop_id,id) NOT VALID;
ALTER TABLE devices VALIDATE CONSTRAINT devices_customer_tenant;
ALTER TABLE repair_orders VALIDATE CONSTRAINT orders_device_tenant;
