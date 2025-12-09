CREATE TABLE `notificationAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`deliveredAt` timestamp,
	`deliveryStatus` enum('pending','delivered','failed','expired') DEFAULT 'pending',
	`deliveryError` text,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`dismissedAt` timestamp,
	`deviceType` varchar(50),
	`browserType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userNotificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`quietHoursEnabled` boolean DEFAULT false,
	`quietHoursStart` varchar(5) DEFAULT '22:00',
	`quietHoursEnd` varchar(5) DEFAULT '08:00',
	`quietHoursTimezone` varchar(100) DEFAULT 'UTC',
	`interviewReminderPush` boolean DEFAULT true,
	`interviewReminderEmail` boolean DEFAULT true,
	`feedbackRequestPush` boolean DEFAULT true,
	`feedbackRequestEmail` boolean DEFAULT true,
	`candidateResponsePush` boolean DEFAULT true,
	`candidateResponseEmail` boolean DEFAULT true,
	`engagementAlertPush` boolean DEFAULT true,
	`engagementAlertEmail` boolean DEFAULT false,
	`abTestResultPush` boolean DEFAULT false,
	`abTestResultEmail` boolean DEFAULT true,
	`systemUpdatePush` boolean DEFAULT false,
	`systemUpdateEmail` boolean DEFAULT true,
	`generalPush` boolean DEFAULT true,
	`generalEmail` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userNotificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `notificationAnalytics` ADD CONSTRAINT `notificationAnalytics_notificationId_notificationHistory_id_fk` FOREIGN KEY (`notificationId`) REFERENCES `notificationHistory`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificationAnalytics` ADD CONSTRAINT `notificationAnalytics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userNotificationPreferences` ADD CONSTRAINT `userNotificationPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notificationId_idx` ON `notificationAnalytics` (`notificationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `notificationAnalytics` (`userId`);--> statement-breakpoint
CREATE INDEX `deliveryStatus_idx` ON `notificationAnalytics` (`deliveryStatus`);--> statement-breakpoint
CREATE INDEX `openedAt_idx` ON `notificationAnalytics` (`openedAt`);--> statement-breakpoint
CREATE INDEX `clickedAt_idx` ON `notificationAnalytics` (`clickedAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `userNotificationPreferences` (`userId`);