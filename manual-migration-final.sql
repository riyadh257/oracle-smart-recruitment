-- Manual migration for advanced analytics and automation features (correct table names)

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
	CONSTRAINT `scq_campaignId_fk` FOREIGN KEY (`campaignId`) REFERENCES `bulk_broadcast_campaigns`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `scq_candidateId_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `scq_predictionId_fk` FOREIGN KEY (`predictionId`) REFERENCES `campaign_schedule_predictions`(`id`) ON DELETE no action ON UPDATE no action
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
	CONSTRAINT `csta_campaignId_fk` FOREIGN KEY (`campaignId`) REFERENCES `bulk_broadcast_campaigns`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX `campaignId_idx` ON `campaign_send_time_analytics` (`campaignId`);
CREATE INDEX `hourOfDay_idx` ON `campaign_send_time_analytics` (`hourOfDay`);
CREATE INDEX `dayOfWeek_idx` ON `campaign_send_time_analytics` (`dayOfWeek`);
CREATE INDEX `timezone_idx` ON `campaign_send_time_analytics` (`timezone`);
CREATE INDEX `periodStart_idx` ON `campaign_send_time_analytics` (`periodStart`);
