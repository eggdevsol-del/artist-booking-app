import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, primaryKey, int, varchar, text, datetime, mysqlEnum, timestamp, index, longtext, unique, tinyint } from "drizzle-orm/mysql-core"
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm"

export const appointments = mysqlTable("appointments", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull().references(() => conversations.id, { onDelete: "cascade" }),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	clientId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startTime: datetime({ mode: 'string' }).notNull(),
	endTime: datetime({ mode: 'string' }).notNull(),
	status: mysqlEnum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending').notNull(),
	serviceName: varchar({ length: 255 }),
	price: int(),
	depositAmount: int(),
	depositPaid: tinyint().default(0),
	paymentProof: text(),
	confirmationSent: tinyint().default(0),
	reminderSent: tinyint().default(0),
	followUpSent: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "appointments_id" }),
	]);

export const artistSettings = mysqlTable("artistSettings", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	businessName: text(),
	businessAddress: text(),
	bsb: varchar({ length: 10 }),
	accountNumber: varchar({ length: 20 }),
	depositAmount: int(),
	workSchedule: text().notNull(),
	services: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	autoSendDepositInfo: tinyint().default(0),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "artistSettings_id" }),
	]);

export const clientContent = mysqlTable("client_content", {
	id: int().autoincrement().notNull(),
	clientId: varchar("client_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	artistId: varchar("artist_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	fileKey: varchar("file_key", { length: 255 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileType: mysqlEnum("file_type", ['image', 'video']).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	fileSize: int("file_size").notNull(),
	title: varchar({ length: 255 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
	(table) => [
		index("artist_id").on(table.artistId),
		index("idx_client_artist").on(table.clientId, table.artistId),
		index("idx_file_key").on(table.fileKey),
		primaryKey({ columns: [table.id], name: "client_content_id" }),
	]);

export const clientNotes = mysqlTable("client_notes", {
	id: varchar({ length: 255 }).notNull(),
	artistId: varchar("artist_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	clientId: varchar("client_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	note: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
	(table) => [
		index("client_id").on(table.clientId),
		index("idx_artist_client").on(table.artistId, table.clientId),
		primaryKey({ columns: [table.id], name: "client_notes_id" }),
	]);

export const consultations = mysqlTable("consultations", {
	id: int().autoincrement().notNull(),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	clientId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	conversationId: int().references(() => conversations.id, { onDelete: "cascade" }),
	subject: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	preferredDate: datetime({ mode: 'string' }),
	status: mysqlEnum(['pending', 'responded', 'scheduled', 'completed', 'cancelled', 'archived']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "consultations_id" }),
	]);

export const conversations = mysqlTable("conversations", {
	id: int().autoincrement().notNull(),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	clientId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	pinnedConsultationId: int(), // Breaking circular reference for now
	lastMessageAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "conversations_id" }),
	]);

export const fileStorage = mysqlTable("file_storage", {
	fileKey: varchar("file_key", { length: 255 }).notNull(),
	fileData: longtext("file_data").notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
	(table) => [
		primaryKey({ columns: [table.fileKey], name: "file_storage_file_key" }),
	]);

export const messages = mysqlTable("messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull().references(() => conversations.id, { onDelete: "cascade" }),
	senderId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	content: text().notNull(),
	messageType: mysqlEnum(['text', 'system', 'appointment_request', 'appointment_confirmed', 'image', 'video']).default('text').notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	readBy: text(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "messages_id" }),
	]);

export const notificationSettings = mysqlTable("notificationSettings", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	followupEnabled: tinyint().default(0),
	followupSms: tinyint().default(0),
	followupEmail: tinyint().default(0),
	followupPush: tinyint().default(0),
	followupText: text(),
	followupTriggerType: varchar({ length: 50 }).default('days'),
	followupTriggerValue: int().default(1),
	aftercareEnabled: tinyint().default(0),
	aftercareSms: tinyint().default(0),
	aftercareEmail: tinyint().default(0),
	aftercarePush: tinyint().default(0),
	aftercareDailyMessage: text(),
	aftercarePostMessage: text(),
	aftercareFrequency: varchar({ length: 50 }).default('daily'),
	aftercareDurationDays: int().default(14),
	aftercareTime: varchar({ length: 10 }).default('09:00'),
	reviewEnabled: tinyint().default(0),
	reviewSms: tinyint().default(0),
	reviewEmail: tinyint().default(0),
	reviewPush: tinyint().default(0),
	reviewText: text(),
	reviewGoogleLink: varchar({ length: 500 }),
	reviewFacebookLink: varchar({ length: 500 }),
	reviewCustomLink: varchar({ length: 500 }),
	reviewTriggerType: varchar({ length: 50 }).default('days'),
	reviewTriggerValue: int().default(3),
	prebookingEnabled: tinyint().default(0),
	prebookingSms: tinyint().default(0),
	prebookingEmail: tinyint().default(0),
	prebookingPush: tinyint().default(0),
	prebookingText: text(),
	prebookingIncludeDetails: tinyint().default(1),
	prebookingIncludeTime: tinyint().default(1),
	prebookingIncludeMaps: tinyint().default(0),
	prebookingTriggerType: varchar({ length: 50 }).default('hours'),
	prebookingTriggerValue: int().default(24),
	businessLocation: varchar({ length: 500 }),
	businessAddress: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "notificationSettings_id" }),
		unique("userId").on(table.userId),
	]);

export const notificationTemplates = mysqlTable("notificationTemplates", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	templateType: mysqlEnum(['confirmation', 'reminder', 'follow_up', 'birthday', 'promotional', 'aftercare', 'preparation', 'custom']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	timing: text(),
	enabled: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "notificationTemplates_id" }),
	]);

export const policies = mysqlTable("policies", {
	id: int().autoincrement().notNull(),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	policyType: mysqlEnum(['deposit', 'design', 'reschedule', 'cancellation']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	enabled: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "policies_id" }),
	]);

export const portfolios = mysqlTable("portfolios", {
	id: int().autoincrement().notNull(),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	imageUrl: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
}, (table) => [
	primaryKey({ columns: [table.id], name: "portfolios_id" }),
]);

export const portfolioLikes = mysqlTable("portfolio_likes", {
	id: int().autoincrement().notNull(),
	portfolioId: int().notNull().references(() => portfolios.id, { onDelete: "cascade" }),
	userId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
}, (table) => [
	primaryKey({ columns: [table.id], name: "portfolio_likes_id" }),
	unique("user_portfolio_like").on(table.userId, table.portfolioId),
]);

export const pushSubscriptions = mysqlTable("pushSubscriptions", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	endpoint: text().notNull(),
	keys: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "pushSubscriptions_id" }),
	]);

export const quickActionButtons = mysqlTable("quickActionButtons", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	label: varchar({ length: 100 }).notNull(),
	actionType: mysqlEnum(['send_text', 'find_availability', 'deposit_info', 'custom']).notNull(),
	content: text().notNull(),
	position: int().default(0).notNull(),
	enabled: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "quickActionButtons_id" }),
	]);

export const socialMessageSync = mysqlTable("socialMessageSync", {
	id: int().autoincrement().notNull(),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	platform: mysqlEnum(['instagram', 'facebook']).notNull(),
	lastSyncedAt: timestamp({ mode: 'string' }),
	lastMessageId: varchar({ length: 255 }),
	accessToken: text(),
	refreshToken: text(),
	tokenExpiresAt: timestamp({ mode: 'string' }),
	enabled: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "socialMessageSync_id" }),
	]);

export const users = mysqlTable("users", {
	id: varchar({ length: 64 }).notNull(),
	clerkId: varchar({ length: 255 }).unique(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: varchar({ length: 20 }).default('client').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`(now())`),
	phone: varchar({ length: 20 }),
	avatar: text(),
	bio: text(),
	instagramId: varchar({ length: 255 }),
	instagramUsername: varchar({ length: 255 }),
	facebookId: varchar({ length: 255 }),
	facebookName: varchar({ length: 255 }),
	hasCompletedOnboarding: tinyint().default(0),
	password: text(),
	birthday: datetime({ mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "users_id" }),
	]);

export const voucherTemplates = mysqlTable("voucher_templates", {
	id: int().autoincrement().notNull(),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	value: int().notNull(), // stored in cents
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`),
}, (table) => [
	primaryKey({ columns: [table.id], name: "voucher_templates_id" }),
]);

export const issuedVouchers = mysqlTable("issued_vouchers", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull().references(() => voucherTemplates.id, { onDelete: "cascade" }),
	artistId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	clientId: varchar({ length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	code: varchar({ length: 50 }).notNull().unique(),
	status: mysqlEnum(['active', 'redeemed', 'expired']).default('active').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	redeemedAt: timestamp({ mode: 'string' }),
}, (table) => [
	primaryKey({ columns: [table.id], name: "issued_vouchers_id" }),
	index("idx_voucher_code").on(table.code),
]);


export type InsertConsultation = InferInsertModel<typeof consultations>;
export type SelectConsultation = InferSelectModel<typeof consultations>;
export type InsertConversation = InferInsertModel<typeof conversations>;
export type InsertMessage = InferInsertModel<typeof messages>;
export type InsertSocialMessageSync = InferInsertModel<typeof socialMessageSync>;
export type InsertPortfolio = InferInsertModel<typeof portfolios>;
export type InsertVoucherTemplate = InferInsertModel<typeof voucherTemplates>;
export type InsertIssuedVoucher = InferInsertModel<typeof issuedVouchers>;
