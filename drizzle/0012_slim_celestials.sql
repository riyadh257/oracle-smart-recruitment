CREATE TABLE `testCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`campaignType` enum('email','sms','notification','multi_channel') NOT NULL,
	`templateId` int,
	`targetAudience` json,
	`content` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` int NOT NULL,
	`dataType` enum('candidate','job','application','interview','email','campaign_execution') NOT NULL,
	`recordId` int NOT NULL,
	`recordData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`executedBy` int,
	`sampleDataGenerated` boolean DEFAULT false,
	`testCandidatesCount` int DEFAULT 0,
	`testJobsCount` int DEFAULT 0,
	`testApplicationsCount` int DEFAULT 0,
	`triggersExecuted` int DEFAULT 0,
	`campaignsExecuted` int DEFAULT 0,
	`results` json,
	`errorLog` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` int NOT NULL,
	`testType` varchar(100) NOT NULL,
	`testName` varchar(255) NOT NULL,
	`passed` boolean NOT NULL,
	`expectedValue` text,
	`actualValue` text,
	`executionTime` int,
	`errorMessage` text,
	`stackTrace` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`scenarioType` enum('candidate_application','interview_scheduling','email_campaign','engagement_tracking','ab_testing','full_workflow') NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testTriggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`triggerType` enum('application_submitted','interview_scheduled','interview_completed','feedback_submitted','engagement_score_change','time_based','manual') NOT NULL,
	`triggerConditions` json,
	`delayMinutes` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testTriggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `testCampaigns` ADD CONSTRAINT `testCampaigns_scenarioId_testScenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `testScenarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testCampaigns` ADD CONSTRAINT `testCampaigns_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testData` ADD CONSTRAINT `testData_executionId_testExecutions_id_fk` FOREIGN KEY (`executionId`) REFERENCES `testExecutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testExecutions` ADD CONSTRAINT `testExecutions_scenarioId_testScenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `testScenarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testExecutions` ADD CONSTRAINT `testExecutions_executedBy_users_id_fk` FOREIGN KEY (`executedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testResults` ADD CONSTRAINT `testResults_executionId_testExecutions_id_fk` FOREIGN KEY (`executionId`) REFERENCES `testExecutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testScenarios` ADD CONSTRAINT `testScenarios_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testTriggers` ADD CONSTRAINT `testTriggers_scenarioId_testScenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `testScenarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `scenarioId_idx` ON `testCampaigns` (`scenarioId`);--> statement-breakpoint
CREATE INDEX `executionId_idx` ON `testData` (`executionId`);--> statement-breakpoint
CREATE INDEX `dataType_idx` ON `testData` (`dataType`);--> statement-breakpoint
CREATE INDEX `scenarioId_idx` ON `testExecutions` (`scenarioId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `testExecutions` (`status`);--> statement-breakpoint
CREATE INDEX `executionId_idx` ON `testResults` (`executionId`);--> statement-breakpoint
CREATE INDEX `passed_idx` ON `testResults` (`passed`);--> statement-breakpoint
CREATE INDEX `scenarioId_idx` ON `testTriggers` (`scenarioId`);