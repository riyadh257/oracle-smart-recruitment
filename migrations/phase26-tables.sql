-- Phase 26: Strategic Enhancements Database Tables

-- Budget Scenarios - What-if analysis for campaign budgets
CREATE TABLE IF NOT EXISTS `budgetScenarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `createdBy` INT NOT NULL,
  `totalCost` INT DEFAULT 0 NOT NULL,
  `totalRecipients` INT DEFAULT 0 NOT NULL,
  `expectedConversions` INT DEFAULT 0 NOT NULL,
  `costPerConversion` INT DEFAULT 0 NOT NULL,
  `roi` INT DEFAULT 0 NOT NULL,
  `timeline` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `createdBy_idx` (`createdBy`),
  INDEX `createdAt_idx` (`createdAt`),
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Scenario Campaigns - Campaign inputs for scenarios
CREATE TABLE IF NOT EXISTS `scenarioCampaigns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `scenarioId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `startDate` TIMESTAMP NOT NULL,
  `endDate` TIMESTAMP NOT NULL,
  `estimatedRecipients` INT NOT NULL,
  `costPerRecipient` INT NOT NULL,
  `expectedResponseRate` INT DEFAULT 5 NOT NULL,
  `expectedConversionRate` INT DEFAULT 20 NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `scenarioId_idx` (`scenarioId`),
  FOREIGN KEY (`scenarioId`) REFERENCES `budgetScenarios`(`id`) ON DELETE CASCADE
);

-- Job Failure Alerts - Alert rules and configuration
CREATE TABLE IF NOT EXISTS `jobFailureAlerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `jobName` VARCHAR(255) NOT NULL,
  `enabled` TINYINT DEFAULT 1 NOT NULL,
  `failureThreshold` INT DEFAULT 3 NOT NULL,
  `alertCooldown` INT DEFAULT 30 NOT NULL,
  `retryEnabled` TINYINT DEFAULT 1 NOT NULL,
  `maxRetries` INT DEFAULT 3 NOT NULL,
  `retryBackoffMultiplier` INT DEFAULT 2 NOT NULL,
  `escalationEnabled` TINYINT DEFAULT 0 NOT NULL,
  `escalationThreshold` INT DEFAULT 5 NOT NULL,
  `lastAlertAt` TIMESTAMP NULL,
  `totalAlerts` INT DEFAULT 0 NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `jobName_idx` (`jobName`),
  INDEX `enabled_idx` (`enabled`)
);

-- Job Retry Attempts - Track retry execution history
CREATE TABLE IF NOT EXISTS `jobRetryAttempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `jobExecutionId` INT NOT NULL,
  `attemptNumber` INT NOT NULL,
  `status` ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  `scheduledAt` TIMESTAMP NOT NULL,
  `executedAt` TIMESTAMP NULL,
  `errorMessage` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `jobExecutionId_idx` (`jobExecutionId`),
  INDEX `status_idx` (`status`),
  INDEX `scheduledAt_idx` (`scheduledAt`),
  FOREIGN KEY (`jobExecutionId`) REFERENCES `jobExecutions`(`id`) ON DELETE CASCADE
);
