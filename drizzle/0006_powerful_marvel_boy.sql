CREATE TABLE `client_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(255) NOT NULL,
	`artist_id` varchar(255) NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_type` enum('image','video') NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`title` varchar(255),
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_notes` (
	`id` varchar(255) NOT NULL,
	`artist_id` varchar(255) NOT NULL,
	`client_id` varchar(255) NOT NULL,
	`note` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_storage` (
	`file_key` varchar(255) NOT NULL,
	`file_data` longtext NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `file_storage_file_key` PRIMARY KEY(`file_key`)
);
--> statement-breakpoint
CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`followupEnabled` tinyint DEFAULT 0,
	`followupSms` tinyint DEFAULT 0,
	`followupEmail` tinyint DEFAULT 0,
	`followupPush` tinyint DEFAULT 0,
	`followupText` text,
	`followupTriggerType` varchar(50) DEFAULT 'days',
	`followupTriggerValue` int DEFAULT 1,
	`aftercareEnabled` tinyint DEFAULT 0,
	`aftercareSms` tinyint DEFAULT 0,
	`aftercareEmail` tinyint DEFAULT 0,
	`aftercarePush` tinyint DEFAULT 0,
	`aftercareDailyMessage` text,
	`aftercarePostMessage` text,
	`aftercareFrequency` varchar(50) DEFAULT 'daily',
	`aftercareDurationDays` int DEFAULT 14,
	`aftercareTime` varchar(10) DEFAULT '09:00',
	`reviewEnabled` tinyint DEFAULT 0,
	`reviewSms` tinyint DEFAULT 0,
	`reviewEmail` tinyint DEFAULT 0,
	`reviewPush` tinyint DEFAULT 0,
	`reviewText` text,
	`reviewGoogleLink` varchar(500),
	`reviewFacebookLink` varchar(500),
	`reviewCustomLink` varchar(500),
	`reviewTriggerType` varchar(50) DEFAULT 'days',
	`reviewTriggerValue` int DEFAULT 3,
	`prebookingEnabled` tinyint DEFAULT 0,
	`prebookingSms` tinyint DEFAULT 0,
	`prebookingEmail` tinyint DEFAULT 0,
	`prebookingPush` tinyint DEFAULT 0,
	`prebookingText` text,
	`prebookingIncludeDetails` tinyint DEFAULT 1,
	`prebookingIncludeTime` tinyint DEFAULT 1,
	`prebookingIncludeMaps` tinyint DEFAULT 0,
	`prebookingTriggerType` varchar(50) DEFAULT 'hours',
	`prebookingTriggerValue` int DEFAULT 24,
	`businessLocation` varchar(500),
	`businessAddress` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userId` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `depositPaid` tinyint;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `depositPaid` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `confirmationSent` tinyint;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `confirmationSent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `reminderSent` tinyint;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `reminderSent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `followUpSent` tinyint;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `followUpSent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `artistSettings` MODIFY COLUMN `autoSendDepositInfo` tinyint;--> statement-breakpoint
ALTER TABLE `artistSettings` MODIFY COLUMN `autoSendDepositInfo` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `consultations` MODIFY COLUMN `status` enum('pending','responded','scheduled','completed','cancelled','archived') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `notificationTemplates` MODIFY COLUMN `enabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `policies` MODIFY COLUMN `enabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `quickActionButtons` MODIFY COLUMN `enabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `socialMessageSync` MODIFY COLUMN `enabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password` text;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `hasCompletedOnboarding` tinyint;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `hasCompletedOnboarding` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `conversations` ADD `pinnedConsultationId` int;--> statement-breakpoint
ALTER TABLE `client_content` ADD CONSTRAINT `client_content_client_id_users_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_content` ADD CONSTRAINT `client_content_artist_id_users_id_fk` FOREIGN KEY (`artist_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_notes` ADD CONSTRAINT `client_notes_artist_id_users_id_fk` FOREIGN KEY (`artist_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_notes` ADD CONSTRAINT `client_notes_client_id_users_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificationSettings` ADD CONSTRAINT `notificationSettings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `artist_id` ON `client_content` (`artist_id`);--> statement-breakpoint
CREATE INDEX `idx_client_artist` ON `client_content` (`client_id`,`artist_id`);--> statement-breakpoint
CREATE INDEX `idx_file_key` ON `client_content` (`file_key`);--> statement-breakpoint
CREATE INDEX `client_id` ON `client_notes` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_artist_client` ON `client_notes` (`artist_id`,`client_id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_pinnedConsultationId_consultations_id_fk` FOREIGN KEY (`pinnedConsultationId`) REFERENCES `consultations`(`id`) ON DELETE set null ON UPDATE no action;