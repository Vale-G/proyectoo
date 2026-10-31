import type { Consent, IntakeData } from "@/lib/intake";
import { pgEnum, pgTable, text, timestamp, uuid, varchar, jsonb, integer } from "drizzle-orm/pg-core";

export const repairStatus = pgEnum("repair_status", [
  "received",
  "diagnosing",
  "awaiting_approval",
  "awaiting_deposit",
  "awaiting_part",
  "repairing",
  "testing",
  "ready_for_pickup",
  "delivered",
  "not_repaired",
  "under_warranty",
]);

export const workshops = pgTable("workshops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  publicName: varchar("public_name", { length: 120 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 254 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 48 }).notNull(),
  brand: varchar("brand", { length: 80 }),
  model: varchar("model", { length: 120 }).notNull(),
  color: varchar("color", { length: 48 }),
  serialNumber: varchar("serial_number", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const repairOrders = pgTable("repair_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  deviceId: uuid("device_id").notNull().references(() => devices.id, { onDelete: "restrict" }),
  orderNumber: varchar("order_number", { length: 24 }).notNull(),
  publicToken: varchar("public_token", { length: 96 }).notNull().unique(),
  status: repairStatus("status").notNull().default("received"),
  reportedIssue: text("reported_issue").notNull(),
  intakeCondition: text("intake_condition"),
  accessories: text("accessories"),
  intakeData: jsonb("intake_data").$type<IntakeData>(),
  consent: jsonb("consent").$type<Consent>(),
  initialStatus: repairStatus("initial_status"),
  initialEstimateCents: text("initial_estimate_cents"),
  initialDepositCents: text("initial_deposit_cents"),
  revision: integer("revision").notNull().default(0),
  publicSummary: text("public_summary"),
  partsCents: text("parts_cents"),
  partsDescription: text("parts_description"),
  laborDescription: text("labor_description"),
  laborCents: text("labor_cents"),
  paidCents: text("paid_cents"),
  approvalReference: text("approval_reference"),
  warrantyUntil: timestamp("warranty_until", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  deliveredTo: varchar("delivered_to", { length: 160 }),
  deliveryAccessories: text("delivery_accessories"),
  diagnosis: text("diagnosis"),
  proposedSolution: text("proposed_solution"),
  estimateCents: text("estimate_cents"),
  depositCents: text("deposit_cents"),
  estimatedCompletion: timestamp("estimated_completion", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const repairOrderEvents = pgTable("repair_order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => repairOrders.id, { onDelete: "cascade" }),
  fromStatus: repairStatus("from_status"),
  toStatus: repairStatus("to_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RepairStatus = (typeof repairStatus.enumValues)[number];

export const repairPhotos = pgTable("repair_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => repairOrders.id, { onDelete: "cascade" }),
  mimeType: varchar("mime_type", { length: 32 }).notNull(),
  content: text("content").notNull(),
  description: varchar("description", { length: 300 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
