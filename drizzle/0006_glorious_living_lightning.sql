CREATE TABLE `employerMatchingPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`technicalWeight` int NOT NULL DEFAULT 40,
	`cultureWeight` int NOT NULL DEFAULT 30,
	`wellbeingWeight` int NOT NULL DEFAULT 30,
	`minOverallMatchScore` int NOT NULL DEFAULT 60,
	`minTechnicalScore` int NOT NULL DEFAULT 50,
	`minCultureScore` int NOT NULL DEFAULT 50,
	`minWellbeingScore` int NOT NULL DEFAULT 50,
	`enableAutoNotifications` boolean NOT NULL DEFAULT true,
	`notificationFrequency` enum('immediate','daily_digest','weekly_digest') NOT NULL DEFAULT 'daily_digest',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employerMatchingPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `employerMatchingPreferences_employerId_unique` UNIQUE(`employerId`)
);
--> statement-breakpoint
ALTER TABLE `employerMatchingPreferences` ADD CONSTRAINT `employerMatchingPreferences_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `employerMatchingPreferences` (`employerId`);