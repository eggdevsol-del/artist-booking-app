CREATE TABLE `notification_outbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`payloadJson` text NOT NULL,
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`attemptCount` int DEFAULT 0,
	`lastError` text,
	`nextAttemptAt` datetime,
	`createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_outbox_id` PRIMARY KEY(`id`)
);
CREATE INDEX `idx_status_next_attempt` ON `notification_outbox` (`status`,`nextAttemptAt`);
