CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	`metricValue` bigint,
	`benchmarkValue` bigint,
	`campaignId` int,
	`templateId` int,
	`alertMessage` text,
	`severity` enum('info','warning','critical') DEFAULT 'info',
	`acknowledged` boolean DEFAULT false,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`notes` text,
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceName` enum('qiwa','mhrsd','mol','gosi') NOT NULL,
	`environment` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
	`credentialType` enum('oauth2','api_key','jwt') NOT NULL,
	`clientId` text,
	`clientSecret` text,
	`apiKey` text,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`scope` text,
	`endpointBaseUrl` varchar(500),
	`status` enum('active','expired','revoked','pending') NOT NULL DEFAULT 'pending',
	`lastUsed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiCredentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceName` enum('qiwa','mhrsd','mol','gosi') NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`method` enum('GET','POST','PUT','PATCH','DELETE') NOT NULL,
	`requestHeaders` json,
	`requestBody` text,
	`responseStatus` int,
	`responseHeaders` json,
	`responseBody` text,
	`responseTime` int,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`syncJobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`coverLetter` text,
	`overallMatchScore` int,
	`skillMatchScore` int,
	`cultureFitScore` int,
	`wellbeingMatchScore` int,
	`matchBreakdown` json,
	`status` enum('submitted','screening','interviewing','offered','rejected') DEFAULT 'submitted',
	`qualifiesForBilling` boolean DEFAULT false,
	`billingAmount` bigint,
	`atsSynced` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_job_unique` UNIQUE(`candidateId`,`jobId`)
);
--> statement-breakpoint
CREATE TABLE `atsIntegrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`atsSystem` varchar(100) NOT NULL,
	`atsApiKey` text,
	`atsEndpoint` varchar(500),
	`autoSync` boolean DEFAULT true,
	`lastSync` timestamp,
	`status` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atsIntegrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `betaFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signupId` int NOT NULL,
	`submittedBy` int NOT NULL,
	`category` enum('bug','feature_request','usability','performance','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`status` enum('new','acknowledged','in_progress','resolved','wont_fix') NOT NULL DEFAULT 'new',
	`rating` int,
	`attachmentUrls` json,
	`adminResponse` text,
	`respondedBy` int,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `betaFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `betaOnboardingProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signupId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`totalSteps` int NOT NULL DEFAULT 5,
	`step1Completed` boolean DEFAULT false,
	`step2Completed` boolean DEFAULT false,
	`step3Completed` boolean DEFAULT false,
	`step4Completed` boolean DEFAULT false,
	`step5Completed` boolean DEFAULT false,
	`step1Data` json,
	`step2Data` json,
	`step3Data` json,
	`step4Data` json,
	`step5Data` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `betaOnboardingProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `betaSignups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`industry` varchar(100),
	`companySize` enum('1-10','11-50','51-200','201-500','501+'),
	`currentAts` varchar(255),
	`painPoints` text,
	`expectedHires` int,
	`status` enum('pending','approved','rejected','active','completed') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `betaSignups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`qualifiedApplications` int DEFAULT 0,
	`scheduledInterviews` int DEFAULT 0,
	`totalAmount` bigint NOT NULL,
	`status` enum('pending','paid') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkSchedulingOperations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`jobId` int,
	`operationName` varchar(255) NOT NULL,
	`totalCandidates` int NOT NULL,
	`scheduledCount` int DEFAULT 0,
	`conflictCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`schedulingRules` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `bulkSchedulingOperations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`calendarProvider` enum('google','outlook') NOT NULL,
	`calendarId` varchar(255) NOT NULL,
	`calendarName` varchar(255),
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`lastSyncAt` timestamp,
	`syncStatus` enum('active','error','paused') DEFAULT 'active',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`externalEventId` varchar(255) NOT NULL,
	`summary` text,
	`description` text,
	`location` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`isAllDay` boolean DEFAULT false,
	`status` enum('confirmed','tentative','cancelled') DEFAULT 'confirmed',
	`attendees` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`candidateId` int,
	`applicationId` int,
	`currentStep` varchar(255),
	`executionData` json,
	`status` enum('pending','running','completed','failed','paused') NOT NULL DEFAULT 'pending',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaignExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignPerformanceSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`variantId` int NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`sentCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`conversionCount` int DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`conversionRate` int DEFAULT 0,
	`statisticalSignificance` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignPerformanceSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignTriggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`triggerType` enum('application_submitted','interview_scheduled','interview_completed','application_rejected','email_opened','email_clicked','time_delay') NOT NULL,
	`triggerConditions` json,
	`delayMinutes` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignTriggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`communicationScore` int,
	`leadershipScore` int,
	`teamworkScore` int,
	`problemSolvingScore` int,
	`adaptabilityScore` int,
	`creativityScore` int,
	`criticalThinkingScore` int,
	`emotionalIntelligenceScore` int,
	`empathyScore` int,
	`selfAwarenessScore` int,
	`preferredWorkPace` enum('fast','moderate','methodical'),
	`preferredTeamSize` enum('solo','small','medium','large'),
	`preferredManagementStyle` enum('hands_on','collaborative','autonomous'),
	`preferredCommunicationStyle` enum('direct','collaborative','formal','informal'),
	`careerAmbitionLevel` int,
	`learningAgility` int,
	`growthPotential` int,
	`requiresPrayerBreaks` boolean DEFAULT false,
	`prefersSeparateGenderWorkspace` boolean DEFAULT false,
	`requiresHalalDining` boolean DEFAULT false,
	`culturalAccommodationNeeds` json,
	`maxOvertimeHoursPerWeek` int,
	`requiresFlexibleHours` boolean DEFAULT false,
	`familyCommitments` enum('none','low','moderate','high'),
	`aiConfidenceScore` int,
	`attributeSource` enum('self_reported','ai_inferred','hybrid') DEFAULT 'hybrid',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateAttributes_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidateAttributes_candidateId_unique` UNIQUE(`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `candidateAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`dayOfWeek` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`timezone` varchar(100) DEFAULT 'UTC',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`listName` varchar(255) NOT NULL,
	`description` text,
	`segmentationRules` json NOT NULL,
	`candidateCount` int DEFAULT 0,
	`lastRefreshed` timestamp NOT NULL DEFAULT (now()),
	`isAutoRefresh` boolean DEFAULT true,
	`listType` enum('static','dynamic') NOT NULL DEFAULT 'dynamic',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateValueScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`overallValueScore` int DEFAULT 0,
	`skillRarityScore` int DEFAULT 0,
	`experienceScore` int DEFAULT 0,
	`engagementScore` int DEFAULT 0,
	`fitScore` int DEFAULT 0,
	`demandScore` int DEFAULT 0,
	`competitorInterestSignals` int DEFAULT 0,
	`lastCalculated` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateValueScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidateValueScores_candidateId_unique` UNIQUE(`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`location` varchar(255),
	`headline` varchar(500),
	`summary` text,
	`yearsOfExperience` int,
	`desiredSalaryMin` bigint,
	`desiredSalaryMax` bigint,
	`preferredWorkSetting` enum('remote','hybrid','onsite','flexible'),
	`willingToRelocate` boolean DEFAULT false,
	`technicalSkills` json,
	`softSkills` json,
	`workStyleAttributes` json,
	`personalityTraits` json,
	`cultureFitPreferences` json,
	`resumeUrl` text,
	`resumeFileKey` text,
	`aiProfileScore` int,
	`aiInferredAttributes` json,
	`profileStatus` enum('incomplete','active','inactive') DEFAULT 'incomplete',
	`isAvailable` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coachingSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`sessionType` enum('resume_review','career_path','interview_prep','general'),
	`userQuery` text,
	`aiResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coachingSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communicationEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`employerId` int,
	`applicationId` int,
	`eventType` enum('email_sent','email_opened','email_clicked','application_submitted','application_viewed','interview_scheduled','interview_completed','interview_cancelled','status_changed','note_added','document_uploaded','message_sent','message_received') NOT NULL,
	`eventTitle` varchar(500) NOT NULL,
	`eventDescription` text,
	`eventMetadata` json,
	`relatedEmailId` int,
	`relatedInterviewId` int,
	`initiatedBy` enum('candidate','employer','system') NOT NULL,
	`isRead` boolean DEFAULT false,
	`eventTimestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communicationEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communicationSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`totalEmails` int DEFAULT 0,
	`emailsOpened` int DEFAULT 0,
	`emailsClicked` int DEFAULT 0,
	`totalInterviews` int DEFAULT 0,
	`completedInterviews` int DEFAULT 0,
	`totalApplications` int DEFAULT 0,
	`lastContactDate` timestamp,
	`engagementScore` int DEFAULT 0,
	`responseRate` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communicationSummaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `communicationSummaries_candidateId_unique` UNIQUE(`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `companyInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`glassdoorId` varchar(255),
	`overallRating` int,
	`cultureRating` int,
	`workLifeBalanceRating` int,
	`seniorManagementRating` int,
	`compensationRating` int,
	`careerOpportunitiesRating` int,
	`reviewCount` int,
	`recommendToFriend` int,
	`ceoApproval` int,
	`pros` text,
	`cons` text,
	`industry` varchar(255),
	`size` varchar(100),
	`headquarters` varchar(255),
	`founded` int,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companyInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitiveMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`metricCategory` enum('matching','speed','quality','cost','features') NOT NULL,
	`oracleValue` bigint,
	`oracleRank` int,
	`recruitHoldingsValue` bigint,
	`eightfoldValue` bigint,
	`industryAverageValue` bigint,
	`unit` varchar(50),
	`higherIsBetter` boolean DEFAULT true,
	`competitiveAdvantage` text,
	`improvementOpportunity` text,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitiveMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`alertType` enum('nitaqat_red_zone','nitaqat_yellow_zone','approaching_deadline','permit_expiring','contract_expiring','compliance_violation','penalty_risk','sync_failure') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`alertTitle` varchar(255) NOT NULL,
	`alertMessage` text NOT NULL,
	`actionRequired` text,
	`relatedRecordType` varchar(100),
	`relatedRecordId` int,
	`alertStatus` enum('active','acknowledged','resolved','dismissed') DEFAULT 'active',
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`notificationSent` boolean DEFAULT false,
	`notificationSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`reportType` enum('monthly','quarterly','annual','audit','custom') NOT NULL,
	`reportPeriodStart` timestamp NOT NULL,
	`reportPeriodEnd` timestamp NOT NULL,
	`submittedTo` enum('mhrsd','qiwa','mudad','gosi','other') NOT NULL,
	`submissionStatus` enum('draft','submitted','accepted','rejected','pending_review') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`submittedBy` int,
	`referenceNumber` varchar(100),
	`reportData` json,
	`reportFileUrl` text,
	`responseData` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`datasetType` enum('resume','job_description','mixed','validation') NOT NULL,
	`source` varchar(255),
	`description` text,
	`language` enum('arabic','english','mixed') DEFAULT 'arabic',
	`recordCount` int DEFAULT 0,
	`labeledCount` int DEFAULT 0,
	`validationSplit` int DEFAULT 20,
	`storageUrl` text,
	`fileKey` text,
	`format` enum('json','csv','parquet','txt') DEFAULT 'json',
	`status` enum('collecting','processing','ready','archived') NOT NULL DEFAULT 'collecting',
	`qualityScore` int,
	`metadata` json,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailAbTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`emailType` enum('interview_invite','interview_reminder','application_received','application_update','job_match','rejection','offer','custom') NOT NULL,
	`status` enum('draft','running','completed','paused') DEFAULT 'draft',
	`trafficSplit` int DEFAULT 50,
	`startDate` timestamp,
	`endDate` timestamp,
	`winnerVariant` enum('A','B','none') DEFAULT 'none',
	`autoPromoteWinner` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailAbTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailAbVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`variant` enum('A','B') NOT NULL,
	`templateId` int,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`sentCount` int DEFAULT 0,
	`deliveredCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailAbVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`emailType` enum('invoice','weekly_report','interview_invite','application_confirmation','job_match','custom') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`trackingId` varchar(64) NOT NULL,
	`metadata` json,
	CONSTRAINT `emailAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailAnalytics_trackingId_unique` UNIQUE(`trackingId`)
);
--> statement-breakpoint
CREATE TABLE `emailBranding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#3B82F6',
	`secondaryColor` varchar(7) DEFAULT '#1E40AF',
	`fontFamily` varchar(100) DEFAULT 'Arial, sans-serif',
	`companyName` varchar(255),
	`footerText` text,
	`socialLinks` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailBranding_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailBranding_employerId_unique` UNIQUE(`employerId`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaignVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`variantName` varchar(100) NOT NULL,
	`subjectLine` varchar(500) NOT NULL,
	`emailContent` text NOT NULL,
	`trafficAllocation` int DEFAULT 50,
	`sentCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`replyRate` int DEFAULT 0,
	`conversionCount` int DEFAULT 0,
	`conversionRate` int DEFAULT 0,
	`isWinner` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaignVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`workflowDefinition` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplateVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` varchar(255) NOT NULL,
	`version` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`variables` json,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT false,
	`performanceScore` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalOpened` int NOT NULL DEFAULT 0,
	`totalClicked` int NOT NULL DEFAULT 0,
	`openRate` int NOT NULL DEFAULT 0,
	`clickRate` int NOT NULL DEFAULT 0,
	`notes` text,
	CONSTRAINT `emailTemplateVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('interview_invite','interview_reminder','application_received','application_update','job_match','rejection','offer','custom') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`employeeRef` varchar(255) NOT NULL,
	`department` varchar(255),
	`currentSkills` json,
	`skillGaps` json,
	`retentionRisk` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeSurveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`surveyName` varchar(255) NOT NULL,
	`surveyType` enum('satisfaction','engagement','wellbeing','feedback','exit') NOT NULL,
	`questions` json NOT NULL,
	`targetAudience` enum('all','department','role','specific') NOT NULL,
	`frequency` enum('one_time','weekly','monthly','quarterly') NOT NULL,
	`isAnonymous` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeSurveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(255),
	`companySize` enum('1-10','11-50','51-200','201-500','501-1000','1000+'),
	`description` text,
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`cultureAttributes` json,
	`saasToolEnabled` boolean DEFAULT false,
	`operationalMetrics` json,
	`predictedHiringNeeds` json,
	`billingModel` enum('subscription','performance','hybrid') DEFAULT 'subscription',
	`accountStatus` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int NOT NULL,
	`alertType` enum('declining_engagement','high_value_candidate','competitor_approach','inactive_candidate','engagement_spike') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`alertMessage` text NOT NULL,
	`engagementScoreBefore` int,
	`engagementScoreAfter` int,
	`triggerMetrics` json,
	`isRead` boolean DEFAULT false,
	`isResolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`actionTaken` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`alertType` enum('declining_engagement','high_value_candidate','competitor_approach','inactive_candidate','engagement_spike') NOT NULL,
	`thresholdValue` int NOT NULL,
	`timeWindowDays` int DEFAULT 7,
	`isEnabled` boolean DEFAULT true,
	`notificationMethod` enum('email','dashboard','both') DEFAULT 'both',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagementThresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `externalJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('indeed','glassdoor','linkedin') NOT NULL,
	`externalJobId` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`company` varchar(255),
	`location` varchar(255),
	`description` text,
	`url` text,
	`salaryMin` bigint,
	`salaryMax` bigint,
	`employmentType` varchar(100),
	`postedDate` timestamp,
	`companyRating` int,
	`companyReviews` int,
	`applyUrl` text,
	`isSponsored` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`applicationCount` int DEFAULT 0,
	`lastSynced` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `externalJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedbackTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`interviewType` varchar(100),
	`questions` json,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbackTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governmentSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`syncSystem` enum('mhrsd','qiwa','mudad','absher') NOT NULL,
	`syncType` enum('workforce_data','compliance_report','work_permit','contract','identity_verification') NOT NULL,
	`syncDirection` enum('push','pull','bidirectional') NOT NULL,
	`syncStatus` enum('pending','in_progress','success','failed','partial') NOT NULL DEFAULT 'pending',
	`recordsProcessed` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`requestPayload` json,
	`responsePayload` json,
	`errorMessage` text,
	`errorCode` varchar(100),
	`syncStarted` timestamp NOT NULL,
	`syncCompleted` timestamp,
	`durationMs` int,
	`initiatedBy` int,
	`isAutomated` boolean DEFAULT false,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governmentSyncLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviewCalendarInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`calendarEventId` int,
	`externalEventId` varchar(255),
	`inviteSentAt` timestamp,
	`candidateAccepted` boolean,
	`candidateResponseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviewCalendarInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `interviewCalendarInvites_interviewId_unique` UNIQUE(`interviewId`)
);
--> statement-breakpoint
CREATE TABLE `interviewConflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`conflictDate` timestamp NOT NULL,
	`conflictingInterviewIds` json,
	`conflictType` enum('overlapping','back_to_back','resource') NOT NULL,
	`resolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interviewConflicts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviewFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`candidateId` int NOT NULL,
	`interviewerId` int NOT NULL,
	`overallRating` int NOT NULL,
	`technicalSkillsRating` int,
	`communicationRating` int,
	`problemSolvingRating` int,
	`cultureFitRating` int,
	`recommendation` enum('strong_hire','hire','maybe','no_hire','strong_no_hire') NOT NULL,
	`strengths` text,
	`weaknesses` text,
	`detailedNotes` text,
	`questionsResponses` json,
	`interviewDuration` int,
	`isConfidential` boolean DEFAULT false,
	`submittedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviewFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`duration` int NOT NULL DEFAULT 60,
	`interviewType` enum('phone','video','onsite','technical') NOT NULL DEFAULT 'video',
	`location` text,
	`notes` text,
	`status` enum('scheduled','completed','cancelled','rescheduled') NOT NULL DEFAULT 'scheduled',
	`reminderSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`requiredCommunicationLevel` int,
	`requiredLeadershipLevel` int,
	`requiredTeamworkLevel` int,
	`requiredProblemSolvingLevel` int,
	`requiredAdaptabilityLevel` int,
	`teamSize` int,
	`teamWorkStyle` enum('collaborative','independent','mixed'),
	`managementStyle` enum('hands_on','collaborative','autonomous'),
	`workPaceExpectation` enum('fast','moderate','methodical'),
	`overtimeExpectation` int,
	`travelRequirement` int,
	`providesPrayerFacilities` boolean DEFAULT false,
	`hasGenderSeparateWorkspaces` boolean DEFAULT false,
	`providesHalalDining` boolean DEFAULT false,
	`saudizationCompliant` boolean DEFAULT false,
	`nitaqatCategory` enum('platinum','green','yellow','red'),
	`careerGrowthOpportunities` int,
	`trainingBudgetPerYear` bigint,
	`mentorshipAvailable` boolean DEFAULT false,
	`flexibleHoursAvailable` boolean DEFAULT false,
	`paidTimeOffDays` int,
	`parentalLeaveWeeks` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobAttributes_id` PRIMARY KEY(`id`),
	CONSTRAINT `jobAttributes_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `jobDescriptionAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int,
	`jobDescription` text NOT NULL,
	`language` enum('arabic','english','mixed') DEFAULT 'mixed',
	`analysisStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`confidenceScore` int,
	`extractedRequirements` json,
	`inferredAttributes` json,
	`cultureFitIndicators` json,
	`salaryRange` json,
	`errorMessage` text,
	`processingTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobDescriptionAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`location` varchar(255),
	`workSetting` enum('remote','hybrid','onsite','flexible'),
	`employmentType` enum('full_time','part_time','contract'),
	`salaryMin` bigint,
	`salaryMax` bigint,
	`originalDescription` text,
	`enrichedDescription` text,
	`requiredSkills` json,
	`aiInferredRequirements` json,
	`idealCandidateProfile` json,
	`status` enum('draft','active','closed') DEFAULT 'draft',
	`viewCount` int DEFAULT 0,
	`applicationCount` int DEFAULT 0,
	`atsJobId` varchar(255),
	`atsSystem` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ksaCoachingSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`sessionType` enum('ksa_market_guidance','vision2030_alignment','saudization_advice','arabic_cv_optimization','cultural_fit_coaching','salary_negotiation_ksa','industry_specific_prep') NOT NULL,
	`userQuery` text,
	`aiResponse` text,
	`targetIndustry` varchar(255),
	`targetRole` varchar(255),
	`skillGapsIdentified` json,
	`recommendedUpskilling` json,
	`marketInsightsProvided` json,
	`actionItemsGenerated` json,
	`candidateSatisfaction` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ksaCoachingSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ksaMarketData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`demandLevel` enum('low','moderate','high','critical') NOT NULL,
	`demandTrend` enum('declining','stable','growing','surging'),
	`averageSalary` bigint,
	`salaryRangeMin` bigint,
	`salaryRangeMax` bigint,
	`primaryIndustries` json,
	`vision2030Alignment` boolean DEFAULT false,
	`saudizationPriority` boolean DEFAULT false,
	`availableTalentCount` int,
	`talentGapPercentage` int,
	`recommendedCourses` json,
	`averageTrainingDuration` int,
	`dataSource` varchar(255),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ksaMarketData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `laborLawCompliance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int,
	`employeeName` varchar(255) NOT NULL,
	`employeeType` enum('saudi','expat') NOT NULL,
	`weeklyWorkingHours` int DEFAULT 48,
	`weeklyOvertimeHours` int DEFAULT 0,
	`isWorkingHoursCompliant` boolean DEFAULT true,
	`annualLeaveDays` int DEFAULT 21,
	`sickLeaveDays` int DEFAULT 0,
	`eidLeaveDays` int DEFAULT 4,
	`nationalDayLeaveDays` int DEFAULT 1,
	`contractType` enum('fixed_term','indefinite') NOT NULL,
	`probationPeriodDays` int DEFAULT 90,
	`noticePeriodDays` int DEFAULT 60,
	`endOfServiceBenefitAmount` bigint,
	`lastCalculatedDate` timestamp,
	`violationType` varchar(255),
	`violationDescription` text,
	`violationDate` timestamp,
	`violationResolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `laborLawCompliance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`candidateId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`matchScore` int,
	`tags` json,
	CONSTRAINT `listMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `list_candidate_unique` UNIQUE(`listId`,`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `mhrsdRegulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`regulationId` varchar(255) NOT NULL,
	`titleAr` text,
	`titleEn` text,
	`category` varchar(255),
	`descriptionAr` text,
	`descriptionEn` text,
	`effectiveDate` timestamp,
	`expiryDate` timestamp,
	`status` enum('active','draft','archived') DEFAULT 'active',
	`applicableSectors` json,
	`complianceRequirements` json,
	`penalties` json,
	`documentUrl` varchar(1000),
	`rawData` json,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mhrsdRegulations_id` PRIMARY KEY(`id`),
	CONSTRAINT `mhrsdRegulations_regulationId_unique` UNIQUE(`regulationId`)
);
--> statement-breakpoint
CREATE TABLE `mhrsdReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`reportType` enum('monthly','quarterly','annual','ad_hoc') NOT NULL,
	`reportPeriodStart` timestamp NOT NULL,
	`reportPeriodEnd` timestamp NOT NULL,
	`reportData` json NOT NULL,
	`reportFileUrl` text,
	`reportFileKey` text,
	`submissionStatus` enum('draft','submitted','accepted','rejected') DEFAULT 'draft',
	`submittedAt` timestamp,
	`submittedBy` int,
	`mhrsdReferenceNumber` varchar(255),
	`mhrsdResponse` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mhrsdReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mhrsdSyncStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`lastSyncAt` timestamp,
	`nextScheduledSync` timestamp,
	`syncStatus` enum('success','failed','in_progress','pending') NOT NULL DEFAULT 'pending',
	`syncType` enum('manual','scheduled','automatic') DEFAULT 'automatic',
	`recordsSynced` int DEFAULT 0,
	`errorMessage` text,
	`syncDuration` int,
	`dataHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mhrsdSyncStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modelInferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingJobId` int,
	`modelVersion` varchar(100) NOT NULL,
	`inferenceType` enum('resume_parsing','job_matching','skill_extraction') NOT NULL,
	`inputText` text NOT NULL,
	`inputLanguage` enum('arabic','english','mixed'),
	`outputData` json,
	`confidenceScore` int,
	`processingTime` int,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`feedbackProvided` boolean DEFAULT false,
	`feedbackCorrect` boolean,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modelInferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mudadContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int,
	`employeeName` varchar(255) NOT NULL,
	`nationalId` varchar(50) NOT NULL,
	`contractType` enum('fixed_term','indefinite','part_time','seasonal') NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`salary` bigint NOT NULL,
	`allowances` bigint,
	`contractStartDate` timestamp NOT NULL,
	`contractEndDate` timestamp,
	`probationPeriodDays` int DEFAULT 90,
	`mudadStatus` enum('draft','submitted','active','terminated','expired') DEFAULT 'draft',
	`mudadContractId` varchar(255),
	`mudadSubmissionDate` timestamp,
	`contractFileUrl` text,
	`contractFileKey` text,
	`terminationDate` timestamp,
	`terminationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mudadContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nitaqatTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`totalEmployees` int NOT NULL DEFAULT 0,
	`saudiEmployees` int NOT NULL DEFAULT 0,
	`expatEmployees` int NOT NULL DEFAULT 0,
	`saudizationPercentage` bigint NOT NULL DEFAULT 0,
	`entitySize` enum('small','medium','large','very_large') NOT NULL,
	`activitySector` varchar(255) NOT NULL,
	`nitaqatBand` enum('platinum','green','yellow','red') NOT NULL,
	`requiredSaudizationPercentage` bigint NOT NULL,
	`isCompliant` boolean NOT NULL DEFAULT false,
	`complianceGap` int,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`estimatedPenalty` bigint,
	`eligibleIncentives` json,
	`projectedComplianceDate` timestamp,
	`forecastedBand3Months` enum('platinum','green','yellow','red'),
	`forecastedBand6Months` enum('platinum','green','yellow','red'),
	`forecastedBand12Months` enum('platinum','green','yellow','red'),
	`lastCalculated` timestamp NOT NULL DEFAULT (now()),
	`calculationSource` enum('manual','qiwa_sync','system_calculated') DEFAULT 'system_calculated',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nitaqatTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nlpTrainingData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataType` enum('resume','job_description','feedback') NOT NULL,
	`originalText` text NOT NULL,
	`correctedExtraction` json,
	`feedbackType` enum('correction','validation','enhancement'),
	`submittedBy` int,
	`language` enum('arabic','english','mixed') DEFAULT 'mixed',
	`usedForTraining` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nlpTrainingData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`enableMonthlyInvoices` boolean DEFAULT true,
	`enableWeeklyReports` boolean DEFAULT true,
	`enableApplicationNotifications` boolean DEFAULT true,
	`enableInterviewReminders` boolean DEFAULT true,
	`enableJobMatchAlerts` boolean DEFAULT true,
	`weeklyReportDay` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') DEFAULT 'monday',
	`weeklyReportTime` varchar(5) DEFAULT '08:00',
	`emailFrequency` enum('realtime','daily_digest','weekly_digest') DEFAULT 'realtime',
	`unsubscribedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_employerId_unique` UNIQUE(`employerId`)
);
--> statement-breakpoint
CREATE TABLE `performanceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`alertName` varchar(255) NOT NULL,
	`alertType` enum('underperformance','high_engagement','low_deliverability','benchmark_deviation','campaign_success') NOT NULL,
	`triggerConditions` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastTriggered` timestamp,
	`triggerCount` int DEFAULT 0,
	`notificationChannels` json,
	`recipientEmails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictiveInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`predictedHiringNeedDate` timestamp,
	`predictedRole` varchar(255),
	`predictedHeadcount` int,
	`predictionConfidence` int,
	`predictionReason` text,
	`identifiedSkillGaps` json,
	`turnoverRiskDepartments` json,
	`seasonalHiringPattern` json,
	`talentScarcityLevel` enum('low','moderate','high','critical'),
	`averageTimeToFillDays` int,
	`competitiveHiringPressure` int,
	`recommendedActions` json,
	`proactiveTalentPipelineSize` int,
	`status` enum('active','actioned','dismissed') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predictiveInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qiwaCompanies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`qiwaCompanyId` varchar(255) NOT NULL,
	`commercialRegistration` varchar(255),
	`companyNameAr` varchar(500),
	`companyNameEn` varchar(500),
	`legalForm` varchar(100),
	`sector` varchar(255),
	`activity` text,
	`establishmentDate` timestamp,
	`employeeCount` int,
	`saudiEmployeeCount` int,
	`nonSaudiEmployeeCount` int,
	`nitaqatColor` enum('platinum','green','yellow','red'),
	`nitaqatScore` int,
	`city` varchar(100),
	`region` varchar(100),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`status` enum('active','suspended','closed') DEFAULT 'active',
	`rawData` json,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qiwaCompanies_id` PRIMARY KEY(`id`),
	CONSTRAINT `qiwaCompanies_qiwaCompanyId_unique` UNIQUE(`qiwaCompanyId`)
);
--> statement-breakpoint
CREATE TABLE `qiwaWorkPermits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int,
	`employeeName` varchar(255) NOT NULL,
	`nationalId` varchar(50) NOT NULL,
	`nationality` varchar(100) NOT NULL,
	`permitType` enum('new','renewal','transfer') NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`occupation` varchar(255),
	`applicationStatus` enum('draft','submitted','under_review','approved','rejected','expired') DEFAULT 'draft',
	`qiwaApplicationId` varchar(255),
	`qiwaPermitNumber` varchar(255),
	`applicationDate` timestamp,
	`approvalDate` timestamp,
	`expiryDate` timestamp,
	`rejectionReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qiwaWorkPermits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumeParseResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`resumeUrl` text NOT NULL,
	`resumeFileKey` text,
	`language` enum('arabic','english','mixed') DEFAULT 'mixed',
	`parseStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`confidenceScore` int,
	`extractedData` json,
	`rawText` text,
	`errorMessage` text,
	`processingTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumeParseResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retentionMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`employerId` int,
	`applicationId` int,
	`burnoutRiskScore` int,
	`workLifeBalanceScore` int,
	`jobSatisfactionPrediction` int,
	`retentionProbability6Month` int,
	`retentionProbability1Year` int,
	`retentionProbability2Year` int,
	`identifiedRiskFactors` json,
	`protectiveFactors` json,
	`recommendedInterventions` json,
	`careerDevelopmentNeeds` json,
	`engagementScore` int,
	`motivationLevel` int,
	`assessmentDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retentionMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_job_unique` UNIQUE(`candidateId`,`jobId`)
);
--> statement-breakpoint
CREATE TABLE `schedulingConflictResolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conflictId` int NOT NULL,
	`suggestedTime` timestamp NOT NULL,
	`reason` text,
	`priority` int DEFAULT 0,
	`applied` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedulingConflictResolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`shiftName` varchar(255),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`requiredHeadcount` int NOT NULL,
	`currentHeadcount` int DEFAULT 0,
	`skillsRequired` json,
	`staffingGap` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillGapAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`department` varchar(255),
	`analysisDate` timestamp NOT NULL,
	`currentSkills` json NOT NULL,
	`requiredSkills` json NOT NULL,
	`identifiedGaps` json NOT NULL,
	`trainingRecommendations` json,
	`hiringRecommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skillGapAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategicRoi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`hireId` int,
	`candidateId` int,
	`jobId` int,
	`day90PerformanceScore` int,
	`day180PerformanceScore` int,
	`year1PerformanceScore` int,
	`stillEmployed` boolean DEFAULT true,
	`terminationDate` timestamp,
	`terminationReason` varchar(255),
	`costPerHire` bigint,
	`costPerQualityHire` bigint,
	`timeToHireDays` int,
	`estimatedValueGenerated` bigint,
	`roiPercentage` int,
	`vsTraditionalRecruitmentCost` bigint,
	`vsTraditionalRecruitmentTime` int,
	`hireDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategicRoi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `syncJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` enum('qiwa_companies','qiwa_employees','mhrsd_regulations','mhrsd_violations','mol_contracts','gosi_contributions') NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`triggerType` enum('manual','scheduled','webhook') NOT NULL DEFAULT 'scheduled',
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`cronExpression` varchar(100),
	`recordsProcessed` int DEFAULT 0,
	`recordsCreated` int DEFAULT 0,
	`recordsUpdated` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`errorMessage` text,
	`executionLog` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `syncJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talentPool` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int NOT NULL,
	`tags` json,
	`notes` text,
	`matchScore` int,
	`addedFromJobId` int,
	`status` enum('active','contacted','hired','not_interested') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `talentPool_id` PRIMARY KEY(`id`),
	CONSTRAINT `employer_candidate_unique` UNIQUE(`employerId`,`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `teamMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`teamId` varchar(100) NOT NULL,
	`teamName` varchar(255) NOT NULL,
	`department` varchar(255),
	`memberCount` int NOT NULL,
	`productivityScore` int,
	`collaborationScore` int,
	`goalAchievementRate` int,
	`avgSkillLevel` int,
	`innovationIndex` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainingJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelName` varchar(255) NOT NULL,
	`modelVersion` varchar(100) NOT NULL,
	`modelType` enum('resume_parser','job_matcher','skill_extractor','entity_recognition') NOT NULL,
	`datasetId` int NOT NULL,
	`baseModel` varchar(255),
	`hyperparameters` json,
	`status` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`progress` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`trainingDuration` int,
	`metrics` json,
	`modelArtifactUrl` text,
	`modelArtifactKey` text,
	`errorMessage` text,
	`logs` text,
	`isProduction` boolean DEFAULT false,
	`deployedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainingJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','candidate','employer') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `videoInterviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`candidateId` int NOT NULL,
	`employerId` int NOT NULL,
	`jobId` int NOT NULL,
	`scheduledTime` timestamp,
	`duration` int DEFAULT 30,
	`meetingUrl` text,
	`calendlyEventId` varchar(255),
	`status` enum('pending','scheduled','completed','cancelled') DEFAULT 'pending',
	`notes` text,
	`templateId` int,
	`reminderSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoInterviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workPermits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`candidateId` int,
	`permitNumber` varchar(100) NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`employeeNationalId` varchar(50),
	`nationality` varchar(100),
	`occupation` varchar(255),
	`issueDate` timestamp NOT NULL,
	`expiryDate` timestamp NOT NULL,
	`status` enum('active','expired','cancelled','pending_renewal','suspended') NOT NULL DEFAULT 'active',
	`qiwaReferenceId` varchar(100),
	`renewalReminderSent` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workPermits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workforceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`totalEmployees` int NOT NULL,
	`saudiEmployees` int NOT NULL,
	`expatEmployees` int NOT NULL,
	`saudizationPercentage` bigint NOT NULL,
	`nitaqatBand` enum('platinum','green','yellow','red') NOT NULL,
	`employeesAdded` int DEFAULT 0,
	`employeesRemoved` int DEFAULT 0,
	`saudiEmployeesAdded` int DEFAULT 0,
	`saudiEmployeesRemoved` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workforceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workforcePlanningScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`scenarioName` varchar(255) NOT NULL,
	`scenarioDescription` text,
	`baselineTotalEmployees` int NOT NULL,
	`baselineSaudiEmployees` int NOT NULL,
	`baselineExpatEmployees` int NOT NULL,
	`baselineNitaqatBand` enum('platinum','green','yellow','red') NOT NULL,
	`plannedSaudiHires` int DEFAULT 0,
	`plannedExpatHires` int DEFAULT 0,
	`plannedSaudiTerminations` int DEFAULT 0,
	`plannedExpatTerminations` int DEFAULT 0,
	`projectedTotalEmployees` int NOT NULL,
	`projectedSaudiEmployees` int NOT NULL,
	`projectedExpatEmployees` int NOT NULL,
	`projectedSaudizationPercentage` bigint NOT NULL,
	`projectedNitaqatBand` enum('platinum','green','yellow','red') NOT NULL,
	`complianceImprovement` boolean NOT NULL,
	`bandChange` varchar(100),
	`estimatedCostImpact` bigint,
	`estimatedTimeToCompliance` int,
	`aiRecommendations` json,
	`riskAssessment` text,
	`scenarioStatus` enum('draft','active','implemented','archived') DEFAULT 'draft',
	`implementedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workforcePlanningScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alertHistory` ADD CONSTRAINT `alertHistory_alertId_performanceAlerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `performanceAlerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD CONSTRAINT `alertHistory_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD CONSTRAINT `alertHistory_acknowledgedBy_users_id_fk` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apiLogs` ADD CONSTRAINT `apiLogs_syncJobId_syncJobs_id_fk` FOREIGN KEY (`syncJobId`) REFERENCES `syncJobs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atsIntegrations` ADD CONSTRAINT `atsIntegrations_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `betaFeedback` ADD CONSTRAINT `betaFeedback_signupId_betaSignups_id_fk` FOREIGN KEY (`signupId`) REFERENCES `betaSignups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `betaFeedback` ADD CONSTRAINT `betaFeedback_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `betaFeedback` ADD CONSTRAINT `betaFeedback_respondedBy_users_id_fk` FOREIGN KEY (`respondedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `betaOnboardingProgress` ADD CONSTRAINT `betaOnboardingProgress_signupId_betaSignups_id_fk` FOREIGN KEY (`signupId`) REFERENCES `betaSignups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `betaSignups` ADD CONSTRAINT `betaSignups_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billingRecords` ADD CONSTRAINT `billingRecords_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulkSchedulingOperations` ADD CONSTRAINT `bulkSchedulingOperations_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulkSchedulingOperations` ADD CONSTRAINT `bulkSchedulingOperations_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendarConnections` ADD CONSTRAINT `calendarConnections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendarEvents` ADD CONSTRAINT `calendarEvents_connectionId_calendarConnections_id_fk` FOREIGN KEY (`connectionId`) REFERENCES `calendarConnections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignExecutions` ADD CONSTRAINT `campaignExecutions_campaignId_emailCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `emailCampaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignExecutions` ADD CONSTRAINT `campaignExecutions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignExecutions` ADD CONSTRAINT `campaignExecutions_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignPerformanceSnapshots` ADD CONSTRAINT `campaignPerformanceSnapshots_testId_emailAbTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `emailAbTests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignPerformanceSnapshots` ADD CONSTRAINT `campaignPerformanceSnapshots_variantId_emailCampaignVariants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `emailCampaignVariants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignTriggers` ADD CONSTRAINT `campaignTriggers_campaignId_emailCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `emailCampaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateAttributes` ADD CONSTRAINT `candidateAttributes_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateAvailability` ADD CONSTRAINT `candidateAvailability_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateLists` ADD CONSTRAINT `candidateLists_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateValueScores` ADD CONSTRAINT `candidateValueScores_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidates` ADD CONSTRAINT `candidates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coachingSessions` ADD CONSTRAINT `coachingSessions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communicationEvents` ADD CONSTRAINT `communicationEvents_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communicationEvents` ADD CONSTRAINT `communicationEvents_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communicationEvents` ADD CONSTRAINT `communicationEvents_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communicationSummaries` ADD CONSTRAINT `communicationSummaries_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complianceAlerts` ADD CONSTRAINT `complianceAlerts_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complianceAlerts` ADD CONSTRAINT `complianceAlerts_acknowledgedBy_users_id_fk` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complianceReports` ADD CONSTRAINT `complianceReports_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complianceReports` ADD CONSTRAINT `complianceReports_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `datasets` ADD CONSTRAINT `datasets_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailAbTests` ADD CONSTRAINT `emailAbTests_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailAbVariants` ADD CONSTRAINT `emailAbVariants_testId_emailAbTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `emailAbTests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailAbVariants` ADD CONSTRAINT `emailAbVariants_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailAnalytics` ADD CONSTRAINT `emailAnalytics_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailBranding` ADD CONSTRAINT `emailBranding_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCampaignVariants` ADD CONSTRAINT `emailCampaignVariants_testId_emailAbTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `emailAbTests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCampaigns` ADD CONSTRAINT `emailCampaigns_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplateVersions` ADD CONSTRAINT `emailTemplateVersions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplates` ADD CONSTRAINT `emailTemplates_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeeSkills` ADD CONSTRAINT `employeeSkills_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeeSurveys` ADD CONSTRAINT `employeeSurveys_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employers` ADD CONSTRAINT `employers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `engagementAlerts` ADD CONSTRAINT `engagementAlerts_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `engagementAlerts` ADD CONSTRAINT `engagementAlerts_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `engagementThresholds` ADD CONSTRAINT `engagementThresholds_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedbackTemplates` ADD CONSTRAINT `feedbackTemplates_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `governmentSyncLog` ADD CONSTRAINT `governmentSyncLog_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `governmentSyncLog` ADD CONSTRAINT `governmentSyncLog_initiatedBy_users_id_fk` FOREIGN KEY (`initiatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewCalendarInvites` ADD CONSTRAINT `interviewCalendarInvites_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewCalendarInvites` ADD CONSTRAINT `interviewCalendarInvites_calendarEventId_calendarEvents_id_fk` FOREIGN KEY (`calendarEventId`) REFERENCES `calendarEvents`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewConflicts` ADD CONSTRAINT `interviewConflicts_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewFeedback` ADD CONSTRAINT `interviewFeedback_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewFeedback` ADD CONSTRAINT `interviewFeedback_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewFeedback` ADD CONSTRAINT `interviewFeedback_interviewerId_users_id_fk` FOREIGN KEY (`interviewerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobAttributes` ADD CONSTRAINT `jobAttributes_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobDescriptionAnalysis` ADD CONSTRAINT `jobDescriptionAnalysis_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ksaCoachingSessions` ADD CONSTRAINT `ksaCoachingSessions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `laborLawCompliance` ADD CONSTRAINT `laborLawCompliance_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `laborLawCompliance` ADD CONSTRAINT `laborLawCompliance_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listMembers` ADD CONSTRAINT `listMembers_listId_candidateLists_id_fk` FOREIGN KEY (`listId`) REFERENCES `candidateLists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listMembers` ADD CONSTRAINT `listMembers_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mhrsdReports` ADD CONSTRAINT `mhrsdReports_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mhrsdReports` ADD CONSTRAINT `mhrsdReports_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mhrsdSyncStatus` ADD CONSTRAINT `mhrsdSyncStatus_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modelInferences` ADD CONSTRAINT `modelInferences_trainingJobId_trainingJobs_id_fk` FOREIGN KEY (`trainingJobId`) REFERENCES `trainingJobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modelInferences` ADD CONSTRAINT `modelInferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mudadContracts` ADD CONSTRAINT `mudadContracts_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mudadContracts` ADD CONSTRAINT `mudadContracts_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nitaqatTracking` ADD CONSTRAINT `nitaqatTracking_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nlpTrainingData` ADD CONSTRAINT `nlpTrainingData_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD CONSTRAINT `notificationPreferences_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performanceAlerts` ADD CONSTRAINT `performanceAlerts_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `predictiveInsights` ADD CONSTRAINT `predictiveInsights_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qiwaWorkPermits` ADD CONSTRAINT `qiwaWorkPermits_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qiwaWorkPermits` ADD CONSTRAINT `qiwaWorkPermits_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeParseResults` ADD CONSTRAINT `resumeParseResults_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retentionMetrics` ADD CONSTRAINT `retentionMetrics_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retentionMetrics` ADD CONSTRAINT `retentionMetrics_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retentionMetrics` ADD CONSTRAINT `retentionMetrics_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedJobs` ADD CONSTRAINT `savedJobs_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedJobs` ADD CONSTRAINT `savedJobs_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedulingConflictResolutions` ADD CONSTRAINT `schedulingConflictResolutions_conflictId_interviewConflicts_id_fk` FOREIGN KEY (`conflictId`) REFERENCES `interviewConflicts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skillGapAnalysis` ADD CONSTRAINT `skillGapAnalysis_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategicRoi` ADD CONSTRAINT `strategicRoi_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategicRoi` ADD CONSTRAINT `strategicRoi_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategicRoi` ADD CONSTRAINT `strategicRoi_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `talentPool` ADD CONSTRAINT `talentPool_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `talentPool` ADD CONSTRAINT `talentPool_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `talentPool` ADD CONSTRAINT `talentPool_addedFromJobId_jobs_id_fk` FOREIGN KEY (`addedFromJobId`) REFERENCES `jobs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMetrics` ADD CONSTRAINT `teamMetrics_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainingJobs` ADD CONSTRAINT `trainingJobs_datasetId_datasets_id_fk` FOREIGN KEY (`datasetId`) REFERENCES `datasets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainingJobs` ADD CONSTRAINT `trainingJobs_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoInterviews` ADD CONSTRAINT `videoInterviews_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoInterviews` ADD CONSTRAINT `videoInterviews_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoInterviews` ADD CONSTRAINT `videoInterviews_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoInterviews` ADD CONSTRAINT `videoInterviews_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoInterviews` ADD CONSTRAINT `videoInterviews_templateId_feedbackTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `feedbackTemplates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workPermits` ADD CONSTRAINT `workPermits_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workPermits` ADD CONSTRAINT `workPermits_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workforceHistory` ADD CONSTRAINT `workforceHistory_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workforcePlanningScenarios` ADD CONSTRAINT `workforcePlanningScenarios_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alertId_idx` ON `alertHistory` (`alertId`);--> statement-breakpoint
CREATE INDEX `serviceName_idx` ON `apiCredentials` (`serviceName`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `apiCredentials` (`status`);--> statement-breakpoint
CREATE INDEX `serviceName_idx` ON `apiLogs` (`serviceName`);--> statement-breakpoint
CREATE INDEX `success_idx` ON `apiLogs` (`success`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `apiLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `applications` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `applications` (`jobId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `atsIntegrations` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `billingRecords` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `bulkSchedulingOperations` (`employerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `bulkSchedulingOperations` (`status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `calendarConnections` (`userId`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `calendarConnections` (`isActive`);--> statement-breakpoint
CREATE INDEX `isDefault_idx` ON `calendarConnections` (`isDefault`);--> statement-breakpoint
CREATE INDEX `connectionId_idx` ON `calendarEvents` (`connectionId`);--> statement-breakpoint
CREATE INDEX `startTime_idx` ON `calendarEvents` (`startTime`);--> statement-breakpoint
CREATE INDEX `endTime_idx` ON `calendarEvents` (`endTime`);--> statement-breakpoint
CREATE INDEX `externalEventId_idx` ON `calendarEvents` (`externalEventId`);--> statement-breakpoint
CREATE INDEX `campaignId_idx` ON `campaignExecutions` (`campaignId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `campaignExecutions` (`candidateId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaignExecutions` (`status`);--> statement-breakpoint
CREATE INDEX `testId_idx` ON `campaignPerformanceSnapshots` (`testId`);--> statement-breakpoint
CREATE INDEX `variantId_idx` ON `campaignPerformanceSnapshots` (`variantId`);--> statement-breakpoint
CREATE INDEX `snapshotDate_idx` ON `campaignPerformanceSnapshots` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `campaignId_idx` ON `campaignTriggers` (`campaignId`);--> statement-breakpoint
CREATE INDEX `triggerType_idx` ON `campaignTriggers` (`triggerType`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateAvailability` (`candidateId`);--> statement-breakpoint
CREATE INDEX `dayOfWeek_idx` ON `candidateAvailability` (`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `candidateLists` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateValueScores` (`candidateId`);--> statement-breakpoint
CREATE INDEX `overallValueScore_idx` ON `candidateValueScores` (`overallValueScore`);--> statement-breakpoint
CREATE INDEX `competitorInterestSignals_idx` ON `candidateValueScores` (`competitorInterestSignals`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `candidates` (`userId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `coachingSessions` (`candidateId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `communicationEvents` (`candidateId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `communicationEvents` (`employerId`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `communicationEvents` (`applicationId`);--> statement-breakpoint
CREATE INDEX `eventType_idx` ON `communicationEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `eventTimestamp_idx` ON `communicationEvents` (`eventTimestamp`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `communicationEvents` (`isRead`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `communicationSummaries` (`candidateId`);--> statement-breakpoint
CREATE INDEX `engagementScore_idx` ON `communicationSummaries` (`engagementScore`);--> statement-breakpoint
CREATE INDEX `lastContactDate_idx` ON `communicationSummaries` (`lastContactDate`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `complianceAlerts` (`employerId`);--> statement-breakpoint
CREATE INDEX `alertStatus_idx` ON `complianceAlerts` (`alertStatus`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `complianceAlerts` (`severity`);--> statement-breakpoint
CREATE INDEX `datasetType_idx` ON `datasets` (`datasetType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `datasets` (`status`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `emailAbTests` (`employerId`);--> statement-breakpoint
CREATE INDEX `testId_idx` ON `emailAbVariants` (`testId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `emailAnalytics` (`employerId`);--> statement-breakpoint
CREATE INDEX `trackingId_idx` ON `emailAnalytics` (`trackingId`);--> statement-breakpoint
CREATE INDEX `testId_idx` ON `emailCampaignVariants` (`testId`);--> statement-breakpoint
CREATE INDEX `isWinner_idx` ON `emailCampaignVariants` (`isWinner`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `emailCampaigns` (`employerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `emailCampaigns` (`status`);--> statement-breakpoint
CREATE INDEX `templateId_idx` ON `emailTemplateVersions` (`templateId`);--> statement-breakpoint
CREATE INDEX `version_idx` ON `emailTemplateVersions` (`version`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `emailTemplates` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `employeeSkills` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `employeeSurveys` (`employerId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `employers` (`userId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `engagementAlerts` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `engagementAlerts` (`candidateId`);--> statement-breakpoint
CREATE INDEX `alertType_idx` ON `engagementAlerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `engagementAlerts` (`severity`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `engagementAlerts` (`isRead`);--> statement-breakpoint
CREATE INDEX `isResolved_idx` ON `engagementAlerts` (`isResolved`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `engagementThresholds` (`employerId`);--> statement-breakpoint
CREATE INDEX `alertType_idx` ON `engagementThresholds` (`alertType`);--> statement-breakpoint
CREATE INDEX `isEnabled_idx` ON `engagementThresholds` (`isEnabled`);--> statement-breakpoint
CREATE INDEX `externalJobId_idx` ON `externalJobs` (`externalJobId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `feedbackTemplates` (`employerId`);--> statement-breakpoint
CREATE INDEX `interviewType_idx` ON `feedbackTemplates` (`interviewType`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `governmentSyncLog` (`employerId`);--> statement-breakpoint
CREATE INDEX `syncSystem_idx` ON `governmentSyncLog` (`syncSystem`);--> statement-breakpoint
CREATE INDEX `syncStatus_idx` ON `governmentSyncLog` (`syncStatus`);--> statement-breakpoint
CREATE INDEX `interviewId_idx` ON `interviewCalendarInvites` (`interviewId`);--> statement-breakpoint
CREATE INDEX `calendarEventId_idx` ON `interviewCalendarInvites` (`calendarEventId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `interviewConflicts` (`employerId`);--> statement-breakpoint
CREATE INDEX `conflictDate_idx` ON `interviewConflicts` (`conflictDate`);--> statement-breakpoint
CREATE INDEX `resolved_idx` ON `interviewConflicts` (`resolved`);--> statement-breakpoint
CREATE INDEX `interviewId_idx` ON `interviewFeedback` (`interviewId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `interviewFeedback` (`candidateId`);--> statement-breakpoint
CREATE INDEX `interviewerId_idx` ON `interviewFeedback` (`interviewerId`);--> statement-breakpoint
CREATE INDEX `recommendation_idx` ON `interviewFeedback` (`recommendation`);--> statement-breakpoint
CREATE INDEX `overallRating_idx` ON `interviewFeedback` (`overallRating`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `interviews` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `interviews` (`candidateId`);--> statement-breakpoint
CREATE INDEX `scheduledAt_idx` ON `interviews` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `interviews` (`status`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `jobs` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `ksaCoachingSessions` (`candidateId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `laborLawCompliance` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `laborLawCompliance` (`candidateId`);--> statement-breakpoint
CREATE INDEX `listId_idx` ON `listMembers` (`listId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `listMembers` (`candidateId`);--> statement-breakpoint
CREATE INDEX `regulationId_idx` ON `mhrsdRegulations` (`regulationId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `mhrsdRegulations` (`category`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `mhrsdRegulations` (`status`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `mhrsdReports` (`employerId`);--> statement-breakpoint
CREATE INDEX `inferenceType_idx` ON `modelInferences` (`inferenceType`);--> statement-breakpoint
CREATE INDEX `success_idx` ON `modelInferences` (`success`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `modelInferences` (`createdAt`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `mudadContracts` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `mudadContracts` (`candidateId`);--> statement-breakpoint
CREATE INDEX `contractEndDate_idx` ON `mudadContracts` (`contractEndDate`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `nitaqatTracking` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `performanceAlerts` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `predictiveInsights` (`employerId`);--> statement-breakpoint
CREATE INDEX `qiwaCompanyId_idx` ON `qiwaCompanies` (`qiwaCompanyId`);--> statement-breakpoint
CREATE INDEX `nitaqatColor_idx` ON `qiwaCompanies` (`nitaqatColor`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `qiwaWorkPermits` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `qiwaWorkPermits` (`candidateId`);--> statement-breakpoint
CREATE INDEX `expiryDate_idx` ON `qiwaWorkPermits` (`expiryDate`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `retentionMetrics` (`candidateId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `retentionMetrics` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `savedJobs` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `savedJobs` (`jobId`);--> statement-breakpoint
CREATE INDEX `conflictId_idx` ON `schedulingConflictResolutions` (`conflictId`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `schedulingConflictResolutions` (`priority`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `shifts` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `skillGapAnalysis` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `strategicRoi` (`employerId`);--> statement-breakpoint
CREATE INDEX `jobType_idx` ON `syncJobs` (`jobType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `syncJobs` (`status`);--> statement-breakpoint
CREATE INDEX `nextRunAt_idx` ON `syncJobs` (`nextRunAt`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `talentPool` (`employerId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `talentPool` (`candidateId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `teamMetrics` (`employerId`);--> statement-breakpoint
CREATE INDEX `modelType_idx` ON `trainingJobs` (`modelType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `trainingJobs` (`status`);--> statement-breakpoint
CREATE INDEX `isProduction_idx` ON `trainingJobs` (`isProduction`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `videoInterviews` (`applicationId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `videoInterviews` (`candidateId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `videoInterviews` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `workforceHistory` (`employerId`);--> statement-breakpoint
CREATE INDEX `snapshotDate_idx` ON `workforceHistory` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `workforcePlanningScenarios` (`employerId`);