ALTER TABLE `users` ADD `clerkId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_clerkId_unique` UNIQUE(`clerkId`);