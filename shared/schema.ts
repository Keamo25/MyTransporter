import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("client"), // client, driver, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transport requests table
export const transportRequests = pgTable("transport_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  itemDescription: text("item_description").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  dimensions: text("dimensions").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, assigned, in_progress, completed, cancelled
  assignedDriverId: integer("assigned_driver_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bids table
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  driverId: integer("driver_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  estimatedDelivery: timestamp("estimated_delivery").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transportRequests: many(transportRequests),
  bids: many(bids),
}));

export const transportRequestsRelations = relations(transportRequests, ({ one, many }) => ({
  client: one(users, {
    fields: [transportRequests.clientId],
    references: [users.id],
  }),
  assignedDriver: one(users, {
    fields: [transportRequests.assignedDriverId],
    references: [users.id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  request: one(transportRequests, {
    fields: [bids.requestId],
    references: [transportRequests.id],
  }),
  driver: one(users, {
    fields: [bids.driverId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

// Schema for backend validation (expects Date objects)
export const insertTransportRequestSchema = createInsertSchema(transportRequests).pick({
  pickupLocation: true,
  deliveryLocation: true,
  pickupDate: true,
  deliveryDate: true,
  itemDescription: true,
  weight: true,
  dimensions: true,
  budget: true,
});

// Schema for frontend form validation (expects strings from form inputs)
export const clientTransportRequestSchema = z.object({
  pickupLocation: z.string().min(1, "Pickup location is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  itemDescription: z.string().min(1, "Item description is required"),
  weight: z.string().min(1, "Weight is required"),
  dimensions: z.string().min(1, "Dimensions are required"),
  budget: z.string().min(1, "Budget is required"),
});

export const insertBidSchema = createInsertSchema(bids).pick({
  requestId: true,
  amount: true,
  message: true,
  estimatedDelivery: true,
});

// Types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;
