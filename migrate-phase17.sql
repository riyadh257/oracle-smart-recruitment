-- Phase 17: Strategic Enhancements Schema Migration
-- Budget Alerts, Scheduled Exports, Enhanced Job Monitoring

-- Budget Thresholds Table
CREATE TABLE IF NOT EXISTS `budgetThresholds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `thresholdType` ENUM('monthly','weekly','daily','per_campaign','total') NOT NULL DEFAULT 'monthly',
  `thresholdAmount` INT NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'SAR',
  `warningPercentage` INT DEFAULT 80,
  `criticalPercentage` INT DEFAULT 95,
  `alertChannels` JSON,
  `alertRecipients` JSON,
  `isActive` TINYINT NOT NULL DEFAULT 1,
  `createdBy` INT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `thresholdType_idx` (`thresholdType`),
  INDEX `isActive_idx` (`isActive`),
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Budget Alerts Table
CREATE TABLE IF NOT EXISTS `budgetAlerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `thresholdId` INT NOT NULL,
  `alertLevel` ENUM('warning','critical','exceeded') NOT NULL,
  `currentSpending` INT NOT NULL,
  `thresholdAmount` INT NOT NULL,
  `percentageUsed` INT NOT NULL,
  `periodStart` TIMESTAMP NOT NULL,
  `periodEnd` TIMESTAMP NOT NULL,
  `smsCount` INT DEFAULT 0,
  `message` TEXT,
  `notificationsSent` JSON,
  `acknowledged` TINYINT DEFAULT 0,
  `acknowledgedBy` INT,
  `acknowledgedAt` TIMESTAMP NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `thresholdId_idx` (`thresholdId`),
  INDEX `alertLevel_idx` (`alertLevel`),
  INDEX `acknowledged_idx` (`acknowledged`),
  INDEX `createdAt_idx` (`createdAt`),
  FOREIGN KEY (`thresholdId`) REFERENCES `budgetThresholds`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Scheduled Exports Table
CREATE TABLE IF NOT EXISTS `scheduledExports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `exportTemplate` ENUM('candidates','interviews','feedback','analytics','campaigns','jobs','applications','custom') NOT NULL,
  `exportFormat` ENUM('csv','pdf','excel') NOT NULL DEFAULT 'csv',
  `schedule` ENUM('daily','weekly','monthly','custom') NOT NULL DEFAULT 'weekly',
  `cronExpression` VARCHAR(100),
  `timezone` VARCHAR(50) DEFAULT 'Asia/Riyadh',
  `filters` JSON,
  `columns` JSON,
  `emailRecipients` JSON,
  `emailSubject` VARCHAR(500),
  `emailBody` TEXT,
  `includeAttachment` TINYINT NOT NULL DEFAULT 1,
  `lastRunAt` TIMESTAMP NULL,
  `nextRunAt` TIMESTAMP NULL,
  `lastRunStatus` ENUM('success','failed','skipped'),
  `lastRunError` TEXT,
  `runCount` INT DEFAULT 0,
  `successCount` INT DEFAULT 0,
  `failureCount` INT DEFAULT 0,
  `isActive` TINYINT NOT NULL DEFAULT 1,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `schedule_idx` (`schedule`),
  INDEX `isActive_idx` (`isActive`),
  INDEX `nextRunAt_idx` (`nextRunAt`),
  INDEX `createdBy_idx` (`createdBy`),
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Scheduled Export Runs Table
CREATE TABLE IF NOT EXISTS `scheduledExportRuns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `scheduledExportId` INT NOT NULL,
  `status` ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `startedAt` TIMESTAMP NULL,
  `completedAt` TIMESTAMP NULL,
  `processingTime` INT,
  `recordCount` INT DEFAULT 0,
  `fileUrl` TEXT,
  `fileKey` TEXT,
  `fileSize` BIGINT,
  `emailsSent` INT DEFAULT 0,
  `emailDeliveryStatus` JSON,
  `errorMessage` TEXT,
  `stackTrace` TEXT,
  `triggeredBy` ENUM('schedule','manual') NOT NULL DEFAULT 'schedule',
  `triggeredByUserId` INT,
  `metadata` JSON,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `scheduledExportId_idx` (`scheduledExportId`),
  INDEX `status_idx` (`status`),
  INDEX `createdAt_idx` (`createdAt`),
  INDEX `triggeredBy_idx` (`triggeredBy`),
  FOREIGN KEY (`scheduledExportId`) REFERENCES `scheduledExports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`triggeredByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
