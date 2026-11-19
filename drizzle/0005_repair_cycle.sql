-- Proposed only. No history is backfilled or reassigned. Apply in an approved isolated QA DB first.
BEGIN;
CREATE TABLE workshop_locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
 name varchar(80) NOT NULL CHECK (length(trim(name)) > 0),
 active boolean NOT NULL DEFAULT true,
 UNIQUE(workshop_id,id), UNIQUE(workshop_id,name)
);
ALTER TABLE workshop_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON workshop_locations FROM PUBLIC, anon, authenticated;
ALTER TABLE repair_orders ADD COLUMN location_id uuid;
ALTER TABLE repair_orders ADD COLUMN final_tests jsonb;
ALTER TABLE repair_orders ADD CONSTRAINT order_location_tenant_fk
 FOREIGN KEY(workshop_id,location_id) REFERENCES workshop_locations(workshop_id,id) ON DELETE RESTRICT;
COMMIT;
