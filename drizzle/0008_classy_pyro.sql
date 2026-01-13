CREATE TABLE `issued_vouchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`code` varchar(50) NOT NULL,
	`status` enum('active','redeemed','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`redeemedAt` timestamp,
	CONSTRAINT `issued_vouchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `issued_vouchers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `portfolio_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_portfolio_like` UNIQUE(`userId`,`portfolioId`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`imageUrl` text NOT NULL,
	`description` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voucher_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`value` int NOT NULL,
	`description` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `voucher_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `issued_vouchers` ADD CONSTRAINT `issued_vouchers_templateId_voucher_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `voucher_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issued_vouchers` ADD CONSTRAINT `issued_vouchers_artistId_users_id_fk` FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issued_vouchers` ADD CONSTRAINT `issued_vouchers_clientId_users_id_fk` FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_likes` ADD CONSTRAINT `portfolio_likes_portfolioId_portfolios_id_fk` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_likes` ADD CONSTRAINT `portfolio_likes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_artistId_users_id_fk` FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voucher_templates` ADD CONSTRAINT `voucher_templates_artistId_users_id_fk` FOREIGN KEY (`artistId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_voucher_code` ON `issued_vouchers` (`code`);