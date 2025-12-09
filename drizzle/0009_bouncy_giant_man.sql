CREATE TABLE `candidateEngagementScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`totalEmailsSent` int DEFAULT 0,
	`totalEmailsOpened` int DEFAULT 0,
	`totalEmailsClicked` int DEFAULT 0,
	`totalSmsReceived` int DEFAULT 0,
	`totalApplications` int DEFAULT 0,
	`totalInterviewResponses` int DEFAULT 0,
	`totalProfileViews` int DEFAULT 0,
	`overallScore` int DEFAULT 0,
	`emailEngagementScore` int DEFAULT 0,
	`applicationEngagementScore` int DEFAULT 0,
	`interviewEngagementScore` int DEFAULT 0,
	`engagementLevel` enum('very_high','high','medium','low','very_low') DEFAULT 'medium',
	`lastEngagementAt` timestamp,
	`firstEngagementAt` timestamp,
	`scoreCalculatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateEngagementScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplateCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplateCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplateLibrary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int,
	`categoryId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`thumbnailUrl` varchar(500),
	`isPublic` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`lastUsedAt` timestamp,
	`variables` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplateLibrary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementScoreHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`score` int NOT NULL,
	`engagementLevel` enum('very_high','high','medium','low','very_low') NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementScoreHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsProviderConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`provider` enum('twilio','aws_sns') NOT NULL,
	`isActive` boolean DEFAULT false,
	`twilioAccountSid` varchar(255),
	`twilioAuthToken` varchar(255),
	`twilioPhoneNumber` varchar(50),
	`awsAccessKeyId` varchar(255),
	`awsSecretAccessKey` varchar(255),
	`awsRegion` varchar(50),
	`awsSnsTopicArn` varchar(500),
	`messagesSent` int DEFAULT 0,
	`messagesDelivered` int DEFAULT 0,
	`messagesFailed` int DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smsProviderConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidateEngagementScores` ADD CONSTRAINT `candidateEngagementScores_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplateLibrary` ADD CONSTRAINT `emailTemplateLibrary_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplateLibrary` ADD CONSTRAINT `emailTemplateLibrary_categoryId_emailTemplateCategories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `emailTemplateCategories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `engagementScoreHistory` ADD CONSTRAINT `engagementScoreHistory_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `smsProviderConfigs` ADD CONSTRAINT `smsProviderConfigs_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateEngagementScores` (`candidateId`);--> statement-breakpoint
CREATE INDEX `overallScore_idx` ON `candidateEngagementScores` (`overallScore`);--> statement-breakpoint
CREATE INDEX `engagementLevel_idx` ON `candidateEngagementScores` (`engagementLevel`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `emailTemplateLibrary` (`employerId`);--> statement-breakpoint
CREATE INDEX `categoryId_idx` ON `emailTemplateLibrary` (`categoryId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `engagementScoreHistory` (`candidateId`);--> statement-breakpoint
CREATE INDEX `recordedAt_idx` ON `engagementScoreHistory` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `smsProviderConfigs` (`employerId`);