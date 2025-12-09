-- Manual migration for advanced analytics and automation features

CREATE TABLE IF NOT EXISTS `ab_test_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`segmentType` enum('all','industry','experience_level','location','skill_category') NOT NULL DEFAULT 'all',
	`segmentValue` varchar(255),
	`winnerVariantId` int,
	`openRateImprovement` int DEFAULT 0,
	`clickRateImprovement` int DEFAULT 0,
	`conversionRateImprovement` int DEFAULT 0,
	`roi` int DEFAULT 0,
	`costSavings` int DEFAULT 0,
	`revenueImpact` int DEFAULT 0,
	`sampleSize` int NOT NULL,
	`confidenceLevel` int DEFAULT 95,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ab_test_insights_id` PRIMARY KEY(`id`),
	CONSTRAINT `ab_test_insights_testId_ab_tests_new_id_fk` FOREIGN KEY (`testId`) REFERENCES `ab_tests_new`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `ab_test_insights_winnerVariantId_ab_test_variants_id_fk` FOREIGN KEY (`winnerVariantId`) REFERENCES `ab_test_variants`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE INDEX `testId_idx` ON `ab_test_insights` (`testId`);
CREATE INDEX `segmentType_idx` ON `ab_test_insights` (`segmentType`);
CREATE INDEX `createdAt_idx` ON `ab_test_insights` (`createdAt`);

CREATE TABLE IF NOT EXISTS `template_performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`emailsSent` int NOT NULL DEFAULT 0,
	`emailsDelivered` int NOT NULL DEFAULT 0,
	`emailsOpened` int NOT NULL DEFAULT 0,
	`emailsClicked` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`conversionRate` int DEFAULT 0,
	`bounceRate` int DEFAULT 0,
	`unsubscribeRate` int DEFAULT 0,
	`averageOpenRate` int DEFAULT 0,
	`averageClickRate` int DEFAULT 0,
	`averageConversionRate` int DEFAULT 0,
	`performanceScore` int DEFAULT 0,
	`trendDirection` enum('improving','stable','declining') DEFAULT 'stable',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `template_performance_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `template_performance_metrics_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX `templateId_idx` ON `template_performance_metrics` (`templateId`);
CREATE INDEX `periodStart_idx` ON `template_performance_metrics` (`periodStart`);
CREATE INDEX `performanceScore_idx` ON `template_performance_metrics` (`performanceScore`);

CREATE TABLE IF NOT EXISTS `template_performance_alert_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`alertType` enum('open_rate_drop','click_rate_drop','conversion_drop','bounce_spike','unsubscribe_spike') NOT NULL,
	`thresholdPercentage` int DEFAULT 20,
	`comparisonPeriodDays` int DEFAULT 30,
	`isEnabled` tinyint NOT NULL DEFAULT 1,
	`notifyOwner` tinyint NOT NULL DEFAULT 1,
	`notifyUsers` json,
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_performance_alert_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `template_performance_alert_config_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX `templateId_idx` ON `template_performance_alert_config` (`templateId`);
CREATE INDEX `isEnabled_idx` ON `template_performance_alert_config` (`isEnabled`);

CREATE TABLE IF NOT EXISTS `template_performance_alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`templateId` int NOT NULL,
	`alertType` enum('open_rate_drop','click_rate_drop','conversion_drop','bounce_spike','unsubscribe_spike') NOT NULL,
	`currentValue` int NOT NULL,
	`historicalAverage` int NOT NULL,
	`percentageChange` int NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`message` text NOT NULL,
	`recommendation` text,
	`acknowledged` tinyint NOT NULL DEFAULT 0,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`actionTaken` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `template_performance_alert_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `template_performance_alert_history_configId_template_performance_alert_config_id_fk` FOREIGN KEY (`configId`) REFERENCES `template_performance_alert_config`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `template_performance_alert_history_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `template_performance_alert_history_acknowledgedBy_users_id_fk` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE INDEX `configId_idx` ON `template_performance_alert_history` (`configId`);
CREATE INDEX `templateId_idx` ON `template_performance_alert_history` (`templateId`);
CREATE INDEX `acknowledged_idx` ON `template_performance_alert_history` (`acknowledged`);
CREATE INDEX `createdAt_idx` ON `template_performance_alert_history` (`createdAt`);

CREATE TABLE IF NOT EXISTS `campaign_schedule_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`optimalSendTime` varchar(50) NOT NULL,
	`optimalDayOfWeek` int NOT NULL,
	`predictionConfidence` int DEFAULT 0,
	`basedOnHistoricalData` tinyint NOT NULL DEFAULT 1,
	`historicalOpenRate` int DEFAULT 0,
	`historicalClickRate` int DEFAULT 0,
	`lastEngagementTime` timestamp,
	`engagementPattern` json,
	`modelVersion` varchar(50) DEFAULT 'v1.0',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_schedule_predictions_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaign_schedule_predictions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX `candidateId_idx` ON `campaign_schedule_predictions` (`candidateId`);
CREATE INDEX `timezone_idx` ON `campaign_schedule_predictions` (`timezone`);
CREATE INDEX `updatedAt_idx` ON `campaign_schedule_predictions` (`updatedAt`);

CREATE TABLE IF NOT EXISTS `scheduled_campaign_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`candidateId` int NOT NULL,
	`scheduledSendTime` timestamp NOT NULL,
	`candidateLocalTime` varchar(50) NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`predictionId` int,
	`status` enum('queued','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`failureReason` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`priority` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_campaign_queue_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduled_campaign_queue_campaignId_bulkBroadcastCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `bulkBroadcastCampaigns`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `scheduled_campaign_queue_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `scheduled_campaign_queue_predictionId_campaign_schedule_predictions_id_fk` FOREIGN KEY (`predictionId`) REFERENCES `campaign_schedule_predictions`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE INDEX `campaignId_idx` ON `scheduled_campaign_queue` (`campaignId`);
CREATE INDEX `candidateId_idx` ON `scheduled_campaign_queue` (`candidateId`);
CREATE INDEX `scheduledSendTime_idx` ON `scheduled_campaign_queue` (`scheduledSendTime`);
CREATE INDEX `status_idx` ON `scheduled_campaign_queue` (`status`);
CREATE INDEX `priority_idx` ON `scheduled_campaign_queue` (`priority`);

CREATE TABLE IF NOT EXISTS `campaign_send_time_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`hourOfDay` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`emailsSent` int NOT NULL DEFAULT 0,
	`emailsOpened` int NOT NULL DEFAULT 0,
	`emailsClicked` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`conversionRate` int DEFAULT 0,
	`averageTimeToOpen` int,
	`averageTimeToClick` int,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_send_time_analytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaign_send_time_analytics_campaignId_bulkBroadcastCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `bulkBroadcastCampaigns`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX `campaignId_idx` ON `campaign_send_time_analytics` (`campaignId`);
CREATE INDEX `hourOfDay_idx` ON `campaign_send_time_analytics` (`hourOfDay`);
CREATE INDEX `dayOfWeek_idx` ON `campaign_send_time_analytics` (`dayOfWeek`);
CREATE INDEX `timezone_idx` ON `campaign_send_time_analytics` (`timezone`);
CREATE INDEX `periodStart_idx` ON `campaign_send_time_analytics` (`periodStart`);
