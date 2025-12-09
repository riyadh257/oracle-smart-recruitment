CREATE TABLE `applicationStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`previousStatus` enum('submitted','screening','interviewing','offered','rejected'),
	`newStatus` enum('submitted','screening','interviewing','offered','rejected') NOT NULL,
	`changedBy` int,
	`notes` text,
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `applicationStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateNotificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobAlertFrequency` enum('instant','daily_digest','weekly_summary','off') DEFAULT 'daily_digest',
	`applicationStatusUpdates` boolean DEFAULT true,
	`interviewReminders` boolean DEFAULT true,
	`newJobMatches` boolean DEFAULT true,
	`companyUpdates` boolean DEFAULT false,
	`careerTips` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateNotificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidateNotificationPreferences_candidateId_unique` UNIQUE(`candidateId`)
);
--> statement-breakpoint
ALTER TABLE `applicationStatusHistory` ADD CONSTRAINT `applicationStatusHistory_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationStatusHistory` ADD CONSTRAINT `applicationStatusHistory_changedBy_users_id_fk` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateNotificationPreferences` ADD CONSTRAINT `candidateNotificationPreferences_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `applicationStatusHistory` (`applicationId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `applicationStatusHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateNotificationPreferences` (`candidateId`);