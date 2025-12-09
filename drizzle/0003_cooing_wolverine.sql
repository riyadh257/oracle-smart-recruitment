CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('interview_reminder','feedback_request','candidate_response','engagement_alert','ab_test_result','system_update','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`actionUrl` text,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`deliveryMethod` enum('push','email','both') DEFAULT 'push',
	`pushSent` boolean DEFAULT false,
	`pushSentAt` timestamp,
	`emailSent` boolean DEFAULT false,
	`emailSentAt` timestamp,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` text,
	`isActive` boolean DEFAULT true,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notificationHistory` ADD CONSTRAINT `notificationHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD CONSTRAINT `pushSubscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `notificationHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `notificationHistory` (`type`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `notificationHistory` (`isRead`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `notificationHistory` (`priority`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `notificationHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pushSubscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `pushSubscriptions` (`isActive`);