import {
  pgTable,
  text,
  timestamp,
  integer,
    jsonb,

} from "drizzle-orm/pg-core";

import { organization, user } from "@/auth-schema";
// projeccts
export const project = pgTable("project", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),

  name: text("name").notNull(),

  description: text("description"),

  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

// projects consist of many tasks 
export const task = pgTable("task", {
  id: text("id").primaryKey(),

  projectId: text("project_id")
    .notNull()
    .references(() => project.id, {
      onDelete: "cascade",
    }),

  title: text("title").notNull(),

  description: text("description"),

  status: text("status")
    .notNull()
    .default("todo"),

  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});
// task consists of many comments
export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => task.id, {
      onDelete: "cascade",
    }),
  content: text("content").notNull(),
  createdBy: text("created_by")
    .notNull().references(() => user.id),
  createdAt: timestamp("created_at")
    .defaultNow().notNull(),
})
// attachments 
export const attachment = pgTable("attachment", {
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  id: text("id").primaryKey(),
  taskId: text("task_id").references(() => task.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileKey: text("file_key").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: text("uploaded_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// activity feed 
export const activity = pgTable("activity", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),

  userId: text("user_id")
    .notNull()
    .references(() => user.id),

  action: text("action").notNull(),

  entityType: text("entity_type").notNull(),

  entityId: text("entity_id").notNull(),

  message: text("message").notNull(),
  metadata: jsonb("metadata")
  .$type<Record<string, unknown>>()
  .default({})
  .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// organization billing //
//  billing information for each organization
export const organizationBilling = pgTable("organization_billing", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),

  plan: text("plan")
    .notNull()
    .default("free"),

  status: text("status")
    .notNull()
    .default("active"),

  provider: text("provider"),

  customerId: text("customer_id"),

  subscriptionId: text("subscription_id"),

  currentPeriodEnd: timestamp("current_period_end"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

// stripe webhook events // idempotency: track processed event ids
export const stripeWebhookEvent = pgTable("stripe_webhook_event", {
  id: text("id").primaryKey(), // stripe event id (evt_...)
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});