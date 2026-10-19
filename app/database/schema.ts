import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
// users table

export const users = pgTable("users", {
    users_id: uuid("users_id").primaryKey().defaultRandom(),
    users_name: text("users_name").notNull(),
    users_email: text("users_email").notNull().unique(),
    email_verified: boolean("email_verified").default(false),
    image: text("image"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})
//oraganization  table

export const organizations = pgTable("organization", {
    organization_id: uuid("organization_id").primaryKey().defaultRandom(),
    organization_name: text("organization_name").notNull(),
    slugify: text("slugify").notNull().unique(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    logourl: text("logourl").notNull(),
    color:text("color"),
})
// different roles for members in the organization
export const memberRole = pgEnum("member_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "CLIENT",
]);

// organization members table
export const Members = pgTable("organization_members", {
    organization_members_id: uuid("organization_members_id").primaryKey().defaultRandom(),
organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.organization_id, {
      onDelete: "cascade",
    }),

    role: memberRole("role").notNull().default("MEMBER"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

})

// organization invitations table
export const invitations = pgTable("organization_invitations", {
  organization_invitations_id: uuid("organization_invitations_id")
    .primaryKey()
    .notNull().references(() => organizations.organization_id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    role: memberRole("role").notNull().default("MEMBER"),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", {
    withTimezone: true,
  }).notNull(),

  acceptedAt: timestamp("accepted_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
})
  
