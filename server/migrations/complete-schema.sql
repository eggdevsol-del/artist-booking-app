-- Complete database schema for Artist Booking App
-- This file combines all migrations and adds the password field

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
	`id` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`password` varchar(255),
	`loginMethod` varchar(64),
	`role` varchar(20) NOT NULL DEFAULT 'client',
	`createdAt` timestamp DEFAULT (now()),
	`lastSignedIn` timestamp DEFAULT (now()),
	`phone` varchar(20),
	`avatar` text,
	`bio` text,
	`instagramId` varchar(255),
	`instagramUsername` varchar(255),
	`facebookId` varchar(255),
	`facebookName` varchar(255),
	`hasCompletedOnboarding` boolean DEFAULT false,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`lastMessageAt` timestamp DEFAULT (now()),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','system','appointment_request','appointment_confirmed','image') NOT NULL DEFAULT 'text',
	`metadata` text,
	`readBy` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` datetime NOT NULL,
	`endTime` datetime NOT NULL,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`serviceName` varchar(255),
	`price` int,
	`depositAmount` int,
	`depositPaid` boolean DEFAULT false,
	`paymentProof` text,
	`confirmationSent` boolean DEFAULT false,
	`reminderSent` boolean DEFAULT false,
	`followUpSent` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);

-- Create artistSettings table
CREATE TABLE IF NOT EXISTS `artistSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`businessName` text,
	`businessAddress` text,
	`bsb` varchar(10),
	`accountNumber` varchar(20),
	`depositAmount` int,
	`workSchedule` text NOT NULL,
	`services` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `artistSettings_id` PRIMARY KEY(`id`)
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS `consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`conversationId` int,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`preferredDate` datetime,
	`status` enum('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`)
);

-- Create notificationTemplates table
CREATE TABLE IF NOT EXISTS `notificationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`templateType` enum('confirmation','reminder','follow_up','birthday','promotional','aftercare','preparation','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`timing` text,
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `notificationTemplates_id` PRIMARY KEY(`id`)
);

-- Create policies table
CREATE TABLE IF NOT EXISTS `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`policyType` enum('deposit','design','reschedule','cancellation') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);

-- Create pushSubscriptions table
CREATE TABLE IF NOT EXISTS `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`endpoint` text NOT NULL,
	`keys` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);

-- Create quickActionButtons table
CREATE TABLE IF NOT EXISTS `quickActionButtons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`label` varchar(100) NOT NULL,
	`actionType` enum('send_text','find_availability','deposit_info','custom') NOT NULL,
	`content` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `quickActionButtons_id` PRIMARY KEY(`id`)
);

-- Create socialMessageSync table
CREATE TABLE IF NOT EXISTS `socialMessageSync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`lastSyncedAt` timestamp,
	`lastMessageId` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `socialMessageSync_id` PRIMARY KEY(`id`)
);

-- Add foreign key constraints (only if they don't exist)
ALTER TABLE `appointments` 
ADD CONSTRAINT `appointments_conversationId_conversations_id_fk` 
FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `appointments` 
ADD CONSTRAINT `appointments_artistId_users_id_fk` 
FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `appointments` 
ADD CONSTRAINT `appointments_clientId_users_id_fk` 
FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `artistSettings` 
ADD CONSTRAINT `artistSettings_userId_users_id_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `consultations` 
ADD CONSTRAINT `consultations_artistId_users_id_fk` 
FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `consultations` 
ADD CONSTRAINT `consultations_clientId_users_id_fk` 
FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `consultations` 
ADD CONSTRAINT `consultations_conversationId_conversations_id_fk` 
FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `conversations` 
ADD CONSTRAINT `conversations_artistId_users_id_fk` 
FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `conversations` 
ADD CONSTRAINT `conversations_clientId_users_id_fk` 
FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `messages` 
ADD CONSTRAINT `messages_conversationId_conversations_id_fk` 
FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `messages` 
ADD CONSTRAINT `messages_senderId_users_id_fk` 
FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `notificationTemplates` 
ADD CONSTRAINT `notificationTemplates_userId_users_id_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `policies` 
ADD CONSTRAINT `policies_artistId_users_id_fk` 
FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `pushSubscriptions` 
ADD CONSTRAINT `pushSubscriptions_userId_users_id_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `quickActionButtons` 
ADD CONSTRAINT `quickActionButtons_userId_users_id_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `socialMessageSync` 
ADD CONSTRAINT `socialMessageSync_artistId_users_id_fk` 
FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

