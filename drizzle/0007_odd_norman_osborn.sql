CREATE TABLE `abTestResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`testDuration` int,
	`winnerVariantId` int,
	`winnerDeterminedAt` timestamp,
	`winnerDeterminedBy` enum('automatic','manual'),
	`statisticalSignificance` int DEFAULT 0,
	`pValue` int DEFAULT 0,
	`confidenceLevel` int DEFAULT 95,
	`variantAOpenRate` int DEFAULT 0,
	`variantBOpenRate` int DEFAULT 0,
	`variantAClickRate` int DEFAULT 0,
	`variantBClickRate` int DEFAULT 0,
	`relativeImprovement` int DEFAULT 0,
	`absoluteImprovement` int DEFAULT 0,
	`recommendation` text,
	`appliedToProduction` boolean DEFAULT false,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTestResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcastMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`messageType` enum('sms','whatsapp','email') NOT NULL,
	`messageContent` text NOT NULL,
	`emailSubject` varchar(500),
	`emailHtml` text,
	`targetAudience` enum('all_candidates','filtered','manual_selection') NOT NULL DEFAULT 'all_candidates',
	`filterCriteria` json,
	`status` enum('draft','scheduled','sending','sent','failed','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`successCount` int DEFAULT 0,
	`failureCount` int DEFAULT 0,
	`estimatedCost` int DEFAULT 0,
	`actualCost` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcastMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcastRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`broadcastId` int NOT NULL,
	`candidateId` int,
	`recipientName` varchar(255),
	`recipientEmail` varchar(320),
	`recipientPhone` varchar(50),
	`deliveryStatus` enum('pending','sent','delivered','failed','bounced','opted_out') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`failureReason` text,
	`opened` boolean DEFAULT false,
	`openedAt` timestamp,
	`clicked` boolean DEFAULT false,
	`clickedAt` timestamp,
	`externalMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcastRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`emailAnalyticsId` int,
	`campaignId` int,
	`abTestId` int,
	`variantId` int,
	`eventType` enum('sent','delivered','opened','clicked','bounced','complained','unsubscribed') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`candidateId` int,
	`emailType` enum('interview_invite','interview_reminder','application_received','application_update','job_match','rejection','follow_up','broadcast','custom') NOT NULL,
	`subject` text,
	`linkUrl` text,
	`linkPosition` int,
	`userAgent` text,
	`ipAddress` varchar(45),
	`deviceType` enum('desktop','mobile','tablet','unknown'),
	`eventTimestamp` timestamp NOT NULL,
	`hourOfDay` int,
	`dayOfWeek` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `optimalSendTimes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`emailType` enum('interview_invite','interview_reminder','application_received','application_update','job_match','rejection','follow_up','broadcast','custom') NOT NULL,
	`candidateSegment` varchar(100),
	`optimalDayOfWeek` int NOT NULL,
	`optimalHourOfDay` int NOT NULL,
	`avgOpenRate` int DEFAULT 0,
	`avgClickRate` int DEFAULT 0,
	`sampleSize` int DEFAULT 0,
	`confidenceScore` int DEFAULT 0,
	`analysisStartDate` timestamp NOT NULL,
	`analysisEndDate` timestamp NOT NULL,
	`lastCalculated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `optimalSendTimes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `abTestResults` ADD CONSTRAINT `abTestResults_testId_emailAbTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `emailAbTests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `abTestResults` ADD CONSTRAINT `abTestResults_winnerVariantId_emailAbVariants_id_fk` FOREIGN KEY (`winnerVariantId`) REFERENCES `emailAbVariants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcastMessages` ADD CONSTRAINT `broadcastMessages_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcastMessages` ADD CONSTRAINT `broadcastMessages_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcastRecipients` ADD CONSTRAINT `broadcastRecipients_broadcastId_broadcastMessages_id_fk` FOREIGN KEY (`broadcastId`) REFERENCES `broadcastMessages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcastRecipients` ADD CONSTRAINT `broadcastRecipients_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailEvents` ADD CONSTRAINT `emailEvents_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailEvents` ADD CONSTRAINT `emailEvents_emailAnalyticsId_emailAnalytics_id_fk` FOREIGN KEY (`emailAnalyticsId`) REFERENCES `emailAnalytics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailEvents` ADD CONSTRAINT `emailEvents_campaignId_emailCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `emailCampaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailEvents` ADD CONSTRAINT `emailEvents_abTestId_emailAbTests_id_fk` FOREIGN KEY (`abTestId`) REFERENCES `emailAbTests`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailEvents` ADD CONSTRAINT `emailEvents_variantId_emailAbVariants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `emailAbVariants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailEvents` ADD CONSTRAINT `emailEvents_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `optimalSendTimes` ADD CONSTRAINT `optimalSendTimes_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `testId_idx` ON `abTestResults` (`testId`);--> statement-breakpoint
CREATE INDEX `winnerVariantId_idx` ON `abTestResults` (`winnerVariantId`);--> statement-breakpoint
CREATE INDEX `appliedToProduction_idx` ON `abTestResults` (`appliedToProduction`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `broadcastMessages` (`employerId`);--> statement-breakpoint
CREATE INDEX `createdBy_idx` ON `broadcastMessages` (`createdBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `broadcastMessages` (`status`);--> statement-breakpoint
CREATE INDEX `messageType_idx` ON `broadcastMessages` (`messageType`);--> statement-breakpoint
CREATE INDEX `scheduledAt_idx` ON `broadcastMessages` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `broadcastId_idx` ON `broadcastRecipients` (`broadcastId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `broadcastRecipients` (`candidateId`);--> statement-breakpoint
CREATE INDEX `deliveryStatus_idx` ON `broadcastRecipients` (`deliveryStatus`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `emailEvents` (`employerId`);--> statement-breakpoint
CREATE INDEX `campaignId_idx` ON `emailEvents` (`campaignId`);--> statement-breakpoint
CREATE INDEX `abTestId_idx` ON `emailEvents` (`abTestId`);--> statement-breakpoint
CREATE INDEX `eventType_idx` ON `emailEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `emailType_idx` ON `emailEvents` (`emailType`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `emailEvents` (`candidateId`);--> statement-breakpoint
CREATE INDEX `eventTimestamp_idx` ON `emailEvents` (`eventTimestamp`);--> statement-breakpoint
CREATE INDEX `hourOfDay_idx` ON `emailEvents` (`hourOfDay`);--> statement-breakpoint
CREATE INDEX `dayOfWeek_idx` ON `emailEvents` (`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `optimalSendTimes` (`employerId`);--> statement-breakpoint
CREATE INDEX `emailType_idx` ON `optimalSendTimes` (`emailType`);--> statement-breakpoint
CREATE INDEX `candidateSegment_idx` ON `optimalSendTimes` (`candidateSegment`);