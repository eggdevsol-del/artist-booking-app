ALTER TABLE `consultations` MODIFY COLUMN `status` enum('pending','responded','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `messageType` enum('text','system','appointment_request','appointment_confirmed','image','video') NOT NULL DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `users` ADD `birthday` datetime;