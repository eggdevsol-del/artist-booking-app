import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with artist/client role distinction.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }), // Hashed password for email/password auth
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 })
    .default("client")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),

  // Additional profile fields
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  bio: text("bio"),

  // Social auth
  instagramId: varchar("instagramId", { length: 255 }),
  instagramUsername: varchar("instagramUsername", { length: 255 }),
  facebookId: varchar("facebookId", { length: 255 }),
  facebookName: varchar("facebookName", { length: 255 }),

  // Onboarding
  hasCompletedOnboarding: boolean("hasCompletedOnboarding").default(false),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Artist settings for work hours, services, and business information
 */
export const artistSettings = mysqlTable("artistSettings", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Business information
  businessName: text("businessName"),
  businessAddress: text("businessAddress"),
  bsb: varchar("bsb", { length: 10 }),
  accountNumber: varchar("accountNumber", { length: 20 }),
  depositAmount: int("depositAmount"),
  autoSendDepositInfo: boolean("autoSendDepositInfo").default(false),

  // Work schedule (JSON format: {monday: {enabled: true, start: "09:00", end: "17:00"}, ...})
  workSchedule: text("workSchedule").notNull(),

  // Services offered (JSON array: [{name: "Consultation", duration: 60, price: 100}, ...])
  services: text("services").notNull(),

  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type ArtistSettings = typeof artistSettings.$inferSelect;
export type InsertArtistSettings = typeof artistSettings.$inferInsert;

/**
 * Chat conversations between artist and clients
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").primaryKey().autoincrement(),
  artistId: varchar("artistId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("clientId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  lastMessageAt: timestamp("lastMessageAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Individual chat messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversationId")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("senderId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", [
    "text",
    "system",
    "appointment_request",
    "appointment_confirmed",
    "image",
  ])
    .default("text")
    .notNull(),

  // For appointment-related messages (JSON format)
  metadata: text("metadata"),

  // Track if message has been read by recipient
  readBy: text("readBy"), // JSON array of user IDs who have read this message

  createdAt: timestamp("createdAt").defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Appointments/bookings
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversationId")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  artistId: varchar("artistId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("clientId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  startTime: datetime("startTime").notNull(),
  endTime: datetime("endTime").notNull(),

  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ])
    .default("pending")
    .notNull(),

  // Service details
  serviceName: varchar("serviceName", { length: 255 }),
  price: int("price"),
  depositAmount: int("depositAmount"),
  depositPaid: boolean("depositPaid").default(false),
  paymentProof: text("paymentProof"), // URL to payment screenshot

  // Notifications sent
  confirmationSent: boolean("confirmationSent").default(false),
  reminderSent: boolean("reminderSent").default(false),
  followUpSent: boolean("followUpSent").default(false),

  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Quick action buttons for chat interface
 */
export const quickActionButtons = mysqlTable("quickActionButtons", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  label: varchar("label", { length: 100 }).notNull(),
  actionType: mysqlEnum("actionType", [
    "send_text",
    "find_availability",
    "deposit_info",
    "custom",
  ]).notNull(),

  // Action content (text to send, or JSON config for complex actions)
  content: text("content").notNull(),

  position: int("position").notNull().default(0),
  enabled: boolean("enabled").default(true),

  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type QuickActionButton = typeof quickActionButtons.$inferSelect;
export type InsertQuickActionButton = typeof quickActionButtons.$inferInsert;

/**
 * Notification templates and settings
 */
export const notificationTemplates = mysqlTable("notificationTemplates", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  templateType: mysqlEnum("templateType", [
    "confirmation",
    "reminder",
    "follow_up",
    "birthday",
    "promotional",
    "aftercare",
    "preparation",
    "custom",
  ]).notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),

  // Timing configuration (JSON: {sendBefore: 24, unit: "hours"})
  timing: text("timing"),

  enabled: boolean("enabled").default(true),

  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate =
  typeof notificationTemplates.$inferInsert;

/**
 * Push notification subscriptions
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  endpoint: text("endpoint").notNull(),
  keys: text("keys").notNull(), // JSON: {p256dh, auth}

  createdAt: timestamp("createdAt").defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Social media message sync tracking
 */
export const socialMessageSync = mysqlTable("socialMessageSync", {
  id: int("id").primaryKey().autoincrement(),
  artistId: varchar("artistId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  platform: mysqlEnum("platform", ["instagram", "facebook"]).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  lastMessageId: varchar("lastMessageId", { length: 255 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),

  enabled: boolean("enabled").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type SocialMessageSync = typeof socialMessageSync.$inferSelect;
export type InsertSocialMessageSync = typeof socialMessageSync.$inferInsert;

/**
 * Artist policies (deposit, design, reschedule, cancellation)
 */
export const policies = mysqlTable("policies", {
  id: int("id").primaryKey().autoincrement(),
  artistId: varchar("artistId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  policyType: mysqlEnum("policyType", [
    "deposit",
    "design",
    "reschedule",
    "cancellation",
  ]).notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  enabled: boolean("enabled").default(true),

  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = typeof policies.$inferInsert;

/**
 * Consultation requests
 */
export const consultations = mysqlTable("consultations", {
  id: int("id").primaryKey().autoincrement(),
  artistId: varchar("artistId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("clientId", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: int("conversationId")
    .references(() => conversations.id, { onDelete: "cascade" }),

  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  preferredDate: datetime("preferredDate"),

  status: mysqlEnum("status", [
    "pending",
    "scheduled",
    "completed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),

  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  artistSettings: one(artistSettings, {
    fields: [users.id],
    references: [artistSettings.userId],
  }),
  conversationsAsArtist: many(conversations, { relationName: "artist" }),
  conversationsAsClient: many(conversations, { relationName: "client" }),
  messages: many(messages),
  quickActionButtons: many(quickActionButtons),
  notificationTemplates: many(notificationTemplates),
  pushSubscriptions: many(pushSubscriptions),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    artist: one(users, {
      fields: [conversations.artistId],
      references: [users.id],
      relationName: "artist",
    }),
    client: one(users, {
      fields: [conversations.clientId],
      references: [users.id],
      relationName: "client",
    }),
    messages: many(messages),
    appointments: many(appointments),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  conversation: one(conversations, {
    fields: [appointments.conversationId],
    references: [conversations.id],
  }),
  artist: one(users, {
    fields: [appointments.artistId],
    references: [users.id],
    relationName: "artistAppointments",
  }),
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
    relationName: "clientAppointments",
  }),
}));

