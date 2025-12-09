CREATE TABLE `attributeCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`weight` int DEFAULT 100,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributeCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attributeSubcategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`weight` int DEFAULT 100,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributeSubcategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subcategoryId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`attributeType` enum('skill','experience','education','certification','trait','preference','value') NOT NULL,
	`dataType` enum('boolean','numeric','text','enum','range') NOT NULL,
	`possibleValues` json,
	`weight` int DEFAULT 100,
	`extractionKeywords` json,
	`isActive` boolean DEFAULT true,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateAttributeValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`attributeId` int NOT NULL,
	`value` text,
	`confidence` int DEFAULT 100,
	`source` enum('resume','profile','assessment','inferred','manual') NOT NULL,
	`lastVerified` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateAttributeValues_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_attribute_value_unique` UNIQUE(`candidateId`,`attributeId`)
);
--> statement-breakpoint
CREATE TABLE `candidateCulturePreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`dimensionId` int NOT NULL,
	`preferredScore` int NOT NULL,
	`importance` enum('critical','important','moderate','flexible') DEFAULT 'moderate',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateCulturePreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_dimension_unique` UNIQUE(`candidateId`,`dimensionId`)
);
--> statement-breakpoint
CREATE TABLE `candidateNationality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`isSaudi` boolean NOT NULL,
	`nationalId` varchar(50),
	`iqamaNumber` varchar(50),
	`iqamaExpiry` timestamp,
	`nationality` varchar(100),
	`workPermitStatus` enum('valid','expired','pending','not_required'),
	`workPermitExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateNationality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateWellbeingNeeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`factorId` int NOT NULL,
	`importance` int NOT NULL,
	`currentLevel` int,
	`assessmentResponses` json,
	`burnoutRiskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateWellbeingNeeds_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_factor_unique` UNIQUE(`candidateId`,`factorId`)
);
--> statement-breakpoint
CREATE TABLE `cultureDimensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`dimension` enum('hierarchy_vs_flat','innovation_vs_stability','individual_vs_team','process_vs_results','formal_vs_casual','competitive_vs_collaborative','risk_taking_vs_cautious','work_life_balance') NOT NULL,
	`scaleMin` int DEFAULT 1,
	`scaleMax` int DEFAULT 10,
	`minLabel` varchar(255),
	`maxLabel` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cultureDimensions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cultureFitScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`dimensionId` int NOT NULL,
	`employerScore` int NOT NULL,
	`candidateScore` int NOT NULL,
	`difference` int NOT NULL,
	`compatibility` int NOT NULL,
	`weight` int NOT NULL,
	`explanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cultureFitScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employerCultureProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`dimensionId` int NOT NULL,
	`score` int NOT NULL,
	`description` text,
	`examples` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employerCultureProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `employer_dimension_unique` UNIQUE(`employerId`,`dimensionId`)
);
--> statement-breakpoint
CREATE TABLE `employerWellbeingProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`factorId` int NOT NULL,
	`score` int NOT NULL,
	`supportPrograms` json,
	`policies` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employerWellbeingProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `employer_factor_unique` UNIQUE(`employerId`,`factorId`)
);
--> statement-breakpoint
CREATE TABLE `employmentContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`contractType` enum('full_time','part_time','contract','temporary') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`probationPeriodDays` int DEFAULT 90,
	`probationEndDate` timestamp,
	`noticePeriodDays` int DEFAULT 60,
	`weeklyHours` int DEFAULT 48,
	`isRamadanAdjusted` boolean DEFAULT true,
	`ramadanDailyHours` int DEFAULT 6,
	`annualLeaveDays` int DEFAULT 21,
	`sickLeaveDays` int DEFAULT 120,
	`contractStatus` enum('draft','active','completed','terminated') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employmentContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endOfServiceBenefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`terminationDate` timestamp NOT NULL,
	`terminationType` enum('resignation','termination','mutual','contract_end') NOT NULL,
	`yearsOfService` int NOT NULL,
	`monthsOfService` int NOT NULL,
	`lastSalary` bigint NOT NULL,
	`calculatedBenefit` bigint NOT NULL,
	`calculationMethod` text,
	`paymentStatus` enum('pending','paid','disputed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endOfServiceBenefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gosiVerification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`gosiNumber` varchar(50),
	`verificationStatus` enum('verified','pending','failed','not_applicable') DEFAULT 'pending',
	`verifiedAt` timestamp,
	`verificationError` text,
	`employmentHistory` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gosiVerification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hijriCalendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventName` varchar(255) NOT NULL,
	`eventNameArabic` varchar(255),
	`hijriDate` varchar(50) NOT NULL,
	`gregorianDate` timestamp NOT NULL,
	`isHoliday` boolean DEFAULT false,
	`isPrayerTime` boolean DEFAULT false,
	`description` text,
	`descriptionArabic` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hijriCalendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`attributeId` int NOT NULL,
	`requiredValue` text,
	`importance` enum('required','preferred','nice_to_have') NOT NULL,
	`weight` int DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobRequirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_attribute_unique` UNIQUE(`jobId`,`attributeId`)
);
--> statement-breakpoint
CREATE TABLE `matchDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`attributeId` int NOT NULL,
	`candidateValue` text,
	`requiredValue` text,
	`matchScore` int NOT NULL,
	`weight` int NOT NULL,
	`contribution` int NOT NULL,
	`explanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchExplanations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`explanationType` enum('overall','technical','culture','wellbeing') NOT NULL,
	`score` int NOT NULL,
	`summary` text,
	`strengths` json,
	`concerns` json,
	`recommendations` json,
	`confidenceLevel` int DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchExplanations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prayerTimes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`fajr` varchar(10) NOT NULL,
	`dhuhr` varchar(10) NOT NULL,
	`asr` varchar(10) NOT NULL,
	`maghrib` varchar(10) NOT NULL,
	`isha` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prayerTimes_id` PRIMARY KEY(`id`),
	CONSTRAINT `city_date_idx` UNIQUE(`city`,`date`)
);
--> statement-breakpoint
CREATE TABLE `qiwaIntegrationConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`establishmentId` varchar(255) NOT NULL,
	`apiKey` text,
	`isActive` boolean DEFAULT false,
	`lastSyncAt` timestamp,
	`syncStatus` enum('active','failed','pending'),
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qiwaIntegrationConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qiwaJobSync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`qiwaJobId` varchar(255) NOT NULL,
	`syncStatus` enum('synced','pending','failed') DEFAULT 'pending',
	`lastSyncAt` timestamp,
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qiwaJobSync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saudizationGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`targetDate` timestamp NOT NULL,
	`targetPercentage` int NOT NULL,
	`targetSaudiHires` int NOT NULL,
	`currentProgress` int DEFAULT 0,
	`status` enum('on_track','behind','achieved') DEFAULT 'on_track',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saudizationGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saudizationTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`totalEmployees` int NOT NULL,
	`saudiEmployees` int NOT NULL,
	`nonSaudiEmployees` int NOT NULL,
	`saudizationPercentage` int NOT NULL,
	`nitaqatBand` enum('platinum','green','yellow','red') NOT NULL,
	`targetPercentage` int NOT NULL,
	`complianceStatus` enum('compliant','at_risk','non_compliant') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saudizationTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wellbeingCompatibilityScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`factorId` int NOT NULL,
	`employerSupport` int NOT NULL,
	`candidateNeed` int NOT NULL,
	`compatibility` int NOT NULL,
	`burnoutRiskIndicator` enum('low','moderate','high','critical'),
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wellbeingCompatibilityScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wellbeingFactors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('work_life_balance','stress_management','growth_mindset','autonomy','recognition','purpose','social_connection','physical_health') NOT NULL,
	`assessmentQuestions` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wellbeingFactors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attributeSubcategories` ADD CONSTRAINT `attributeSubcategories_categoryId_attributeCategories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `attributeCategories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attributes` ADD CONSTRAINT `attributes_subcategoryId_attributeSubcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `attributeSubcategories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateAttributeValues` ADD CONSTRAINT `candidateAttributeValues_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateAttributeValues` ADD CONSTRAINT `candidateAttributeValues_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateCulturePreferences` ADD CONSTRAINT `candidateCulturePreferences_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateCulturePreferences` ADD CONSTRAINT `candidateCulturePreferences_dimensionId_cultureDimensions_id_fk` FOREIGN KEY (`dimensionId`) REFERENCES `cultureDimensions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateNationality` ADD CONSTRAINT `candidateNationality_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateWellbeingNeeds` ADD CONSTRAINT `candidateWellbeingNeeds_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateWellbeingNeeds` ADD CONSTRAINT `candidateWellbeingNeeds_factorId_wellbeingFactors_id_fk` FOREIGN KEY (`factorId`) REFERENCES `wellbeingFactors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cultureFitScores` ADD CONSTRAINT `cultureFitScores_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cultureFitScores` ADD CONSTRAINT `cultureFitScores_dimensionId_cultureDimensions_id_fk` FOREIGN KEY (`dimensionId`) REFERENCES `cultureDimensions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employerCultureProfiles` ADD CONSTRAINT `employerCultureProfiles_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employerCultureProfiles` ADD CONSTRAINT `employerCultureProfiles_dimensionId_cultureDimensions_id_fk` FOREIGN KEY (`dimensionId`) REFERENCES `cultureDimensions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employerWellbeingProfiles` ADD CONSTRAINT `employerWellbeingProfiles_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employerWellbeingProfiles` ADD CONSTRAINT `employerWellbeingProfiles_factorId_wellbeingFactors_id_fk` FOREIGN KEY (`factorId`) REFERENCES `wellbeingFactors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employmentContracts` ADD CONSTRAINT `employmentContracts_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endOfServiceBenefits` ADD CONSTRAINT `endOfServiceBenefits_contractId_employmentContracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `employmentContracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gosiVerification` ADD CONSTRAINT `gosiVerification_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobRequirements` ADD CONSTRAINT `jobRequirements_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobRequirements` ADD CONSTRAINT `jobRequirements_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchDetails` ADD CONSTRAINT `matchDetails_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchDetails` ADD CONSTRAINT `matchDetails_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchExplanations` ADD CONSTRAINT `matchExplanations_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qiwaIntegrationConfig` ADD CONSTRAINT `qiwaIntegrationConfig_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qiwaJobSync` ADD CONSTRAINT `qiwaJobSync_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saudizationGoals` ADD CONSTRAINT `saudizationGoals_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saudizationTracking` ADD CONSTRAINT `saudizationTracking_employerId_employers_id_fk` FOREIGN KEY (`employerId`) REFERENCES `employers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wellbeingCompatibilityScores` ADD CONSTRAINT `wellbeingCompatibilityScores_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wellbeingCompatibilityScores` ADD CONSTRAINT `wellbeingCompatibilityScores_factorId_wellbeingFactors_id_fk` FOREIGN KEY (`factorId`) REFERENCES `wellbeingFactors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categoryId_idx` ON `attributeSubcategories` (`categoryId`);--> statement-breakpoint
CREATE INDEX `subcategoryId_idx` ON `attributes` (`subcategoryId`);--> statement-breakpoint
CREATE INDEX `attributeType_idx` ON `attributes` (`attributeType`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateAttributeValues` (`candidateId`);--> statement-breakpoint
CREATE INDEX `attributeId_idx` ON `candidateAttributeValues` (`attributeId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateCulturePreferences` (`candidateId`);--> statement-breakpoint
CREATE INDEX `dimensionId_idx` ON `candidateCulturePreferences` (`dimensionId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateNationality` (`candidateId`);--> statement-breakpoint
CREATE INDEX `isSaudi_idx` ON `candidateNationality` (`isSaudi`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidateWellbeingNeeds` (`candidateId`);--> statement-breakpoint
CREATE INDEX `factorId_idx` ON `candidateWellbeingNeeds` (`factorId`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `cultureFitScores` (`applicationId`);--> statement-breakpoint
CREATE INDEX `dimensionId_idx` ON `cultureFitScores` (`dimensionId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `employerCultureProfiles` (`employerId`);--> statement-breakpoint
CREATE INDEX `dimensionId_idx` ON `employerCultureProfiles` (`dimensionId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `employerWellbeingProfiles` (`employerId`);--> statement-breakpoint
CREATE INDEX `factorId_idx` ON `employerWellbeingProfiles` (`factorId`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `employmentContracts` (`applicationId`);--> statement-breakpoint
CREATE INDEX `contractId_idx` ON `endOfServiceBenefits` (`contractId`);--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `gosiVerification` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `jobRequirements` (`jobId`);--> statement-breakpoint
CREATE INDEX `attributeId_idx` ON `jobRequirements` (`attributeId`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `matchDetails` (`applicationId`);--> statement-breakpoint
CREATE INDEX `attributeId_idx` ON `matchDetails` (`attributeId`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `matchExplanations` (`applicationId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `qiwaIntegrationConfig` (`employerId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `qiwaJobSync` (`jobId`);--> statement-breakpoint
CREATE INDEX `qiwaJobId_idx` ON `qiwaJobSync` (`qiwaJobId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `saudizationGoals` (`employerId`);--> statement-breakpoint
CREATE INDEX `employerId_idx` ON `saudizationTracking` (`employerId`);--> statement-breakpoint
CREATE INDEX `nitaqatBand_idx` ON `saudizationTracking` (`nitaqatBand`);--> statement-breakpoint
CREATE INDEX `applicationId_idx` ON `wellbeingCompatibilityScores` (`applicationId`);--> statement-breakpoint
CREATE INDEX `factorId_idx` ON `wellbeingCompatibilityScores` (`factorId`);