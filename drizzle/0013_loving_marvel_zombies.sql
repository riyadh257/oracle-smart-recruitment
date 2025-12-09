CREATE TABLE `applicationTimeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`eventType` enum('submitted','viewed','screening','interview_scheduled','interview_completed','feedback_received','offer_extended','offer_accepted','offer_declined','rejected','withdrawn') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`performedBy` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `applicationTimeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkMatchingJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` enum('all_candidates_all_jobs','new_candidates','new_jobs','updated_profiles','manual_trigger') NOT NULL,
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`totalCandidates` int DEFAULT 0,
	`totalJobs` int DEFAULT 0,
	`processedCount` int DEFAULT 0,
	`matchesFound` int DEFAULT 0,
	`highQualityMatches` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`triggeredBy` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkMatchingJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidatePreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`preferredIndustries` json,
	`preferredCompanySizes` json,
	`preferredLocations` json,
	`maxCommuteTime` int,
	`desiredBenefits` json,
	`careerGoals` text,
	`learningInterests` json,
	`workLifeBalance` int,
	`growthOpportunities` int,
	`teamSize` enum('small','medium','large','any') DEFAULT 'any',
	`managementStyle` enum('hands_on','autonomous','collaborative','any') DEFAULT 'any',
	`notificationFrequency` enum('immediate','daily','weekly') DEFAULT 'daily',
	`jobAlertEnabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidatePreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidatePreferences_candidateId_unique` UNIQUE(`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `careerCoachingInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`insightType` enum('skill_gap','career_path','resume_improvement','interview_tips','market_trends','salary_guidance','networking_advice') NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`isRead` boolean DEFAULT false,
	`actionItems` json,
	`relatedJobs` json,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `careerCoachingInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `digestDeliveryLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`digestType` enum('daily','weekly','biweekly') NOT NULL,
	`matchCount` int DEFAULT 0,
	`highQualityMatchCount` int DEFAULT 0,
	`newCandidateCount` int DEFAULT 0,
	`emailSent` boolean DEFAULT false,
	`emailOpenedAt` timestamp,
	`emailClickedAt` timestamp,
	`trackingId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `digestDeliveryLog_id` PRIMARY KEY(`id`),
	CONSTRAINT `digestDeliveryLog_trackingId_unique` UNIQUE(`trackingId`)
);
--> statement-breakpoint
CREATE TABLE `matchDigestPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean DEFAULT true,
	`frequency` enum('daily','weekly','biweekly') DEFAULT 'daily',
	`deliveryTime` varchar(5) DEFAULT '08:00',
	`minMatchScore` int DEFAULT 70,
	`maxMatchesPerDigest` int DEFAULT 10,
	`includeNewCandidates` boolean DEFAULT true,
	`includeScoreChanges` boolean DEFAULT true,
	`includeSavedMatches` boolean DEFAULT true,
	`jobFilters` json,
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matchDigestPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `matchDigestPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `matchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`overallMatchScore` int NOT NULL,
	`skillMatchScore` int,
	`cultureFitScore` int,
	`wellbeingMatchScore` int,
	`matchBreakdown` json,
	`changeReason` varchar(500),
	`previousScore` int,
	`scoreChange` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`applicationId` int,
	`notes` text,
	`tags` json,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`status` enum('saved','contacted','interviewing','archived') DEFAULT 'saved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedMatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_candidate_job_unique` UNIQUE(`userId`,`candidateId`,`jobId`)
);
--> statement-breakpoint
ALTER TABLE `applicationTimeline` ADD CONSTRAINT `applicationTimeline_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationTimeline` ADD CONSTRAINT `applicationTimeline_performedBy_users_id_fk` FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulkMatchingJobs` ADD CONSTRAINT `bulkMatchingJobs_triggeredBy_users_id_fk` FOREIGN KEY (`triggeredBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidatePreferences` ADD CONSTRAINT `candidatePreferences_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `careerCoachingInsights` ADD CONSTRAINT `careerCoachingInsights_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digestDeliveryLog` ADD CONSTRAINT `digestDeliveryLog_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchDigestPreferences` ADD CONSTRAINT `matchDigestPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchHistory` ADD CONSTRAINT `matchHistory_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchHistory` ADD CONSTRAINT `matchHistory_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchHistory` ADD CONSTRAINT `matchHistory_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedMatches` ADD CONSTRAINT `savedMatches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedMatches` ADD CONSTRAINT `savedMatches_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedMatches` ADD CONSTRAINT `savedMatches_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedMatches` ADD CONSTRAINT `savedMatches_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `applicationTimeline` (`applicationId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `applicationTimeline` (`createdAt`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `bulkMatchingJobs` (`status`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `bulkMatchingJobs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `careerCoachingInsights` (`candidateId`);--> statement-breakpoint
CREATE INDEX `insightType_idx` ON `careerCoachingInsights` (`insightType`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `careerCoachingInsights` (`isRead`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `digestDeliveryLog` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `digestDeliveryLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `trackingId_idx` ON `digestDeliveryLog` (`trackingId`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `matchHistory` (`applicationId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `matchHistory` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `matchHistory` (`jobId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `matchHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `savedMatches` (`userId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `savedMatches` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `savedMatches` (`jobId`);