-- Create notification templates table
CREATE TABLE IF NOT EXISTS `notificationTemplates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `employerId` int,
  `name` varchar(255) NOT NULL,
  `description` text,
  `type` enum('interview_reminder','feedback_request','candidate_response','engagement_alert','ab_test_result','system_update','general','custom') NOT NULL,
  `channel` enum('push','email','sms','push_email') NOT NULL,
  `subject` varchar(500),
  `bodyTemplate` text NOT NULL,
  `variables` json,
  `isDefault` tinyint DEFAULT 0,
  `isActive` tinyint DEFAULT 1,
  `usageCount` int DEFAULT 0,
  `lastUsedAt` timestamp,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employerId_idx` (`employerId`),
  KEY `type_idx` (`type`),
  KEY `channel_idx` (`channel`),
  KEY `isActive_idx` (`isActive`),
  CONSTRAINT `notificationTemplates_employerId_fk` FOREIGN KEY (`employerId`) REFERENCES `employers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notificationTemplates_createdBy_fk` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- Create notification template variables table
CREATE TABLE IF NOT EXISTS `notificationTemplateVariables` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `placeholder` varchar(100) NOT NULL,
  `dataType` enum('string','number','date','boolean','url') DEFAULT 'string' NOT NULL,
  `defaultValue` text,
  `isRequired` tinyint DEFAULT 0,
  `category` enum('candidate','interview','job','company','system') NOT NULL,
  `exampleValue` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name_idx` (`name`),
  KEY `category_idx` (`category`)
);

-- Add new columns to notificationQueue table (check if exists first)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificationQueue' AND COLUMN_NAME = 'templateId');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `notificationQueue` ADD COLUMN `templateId` int', 'SELECT "Column templateId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificationQueue' AND COLUMN_NAME = 'optimalSendTime');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `notificationQueue` ADD COLUMN `optimalSendTime` tinyint DEFAULT 0', 'SELECT "Column optimalSendTime already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificationQueue' AND COLUMN_NAME = 'userSegment');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `notificationQueue` ADD COLUMN `userSegment` varchar(100)', 'SELECT "Column userSegment already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificationQueue' AND COLUMN_NAME = 'campaignId');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `notificationQueue` ADD COLUMN `campaignId` int', 'SELECT "Column campaignId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes to notificationQueue (ignore errors if they exist)
ALTER TABLE `notificationQueue` ADD KEY `templateId_idx` (`templateId`);
ALTER TABLE `notificationQueue` ADD KEY `userSegment_idx` (`userSegment`);
ALTER TABLE `notificationQueue` ADD KEY `campaignId_idx` (`campaignId`);

-- Insert default template variables
INSERT INTO `notificationTemplateVariables` (`name`, `description`, `placeholder`, `dataType`, `category`, `exampleValue`) VALUES
('candidate_name', 'Full name of the candidate', '{{candidate_name}}', 'string', 'candidate', 'John Doe'),
('candidate_email', 'Email address of the candidate', '{{candidate_email}}', 'string', 'candidate', 'john.doe@example.com'),
('interview_date', 'Scheduled interview date', '{{interview_date}}', 'date', 'interview', '2024-01-15'),
('interview_time', 'Scheduled interview time', '{{interview_time}}', 'string', 'interview', '10:00 AM'),
('interview_location', 'Interview location or meeting link', '{{interview_location}}', 'url', 'interview', 'https://meet.google.com/abc-defg-hij'),
('job_title', 'Title of the job position', '{{job_title}}', 'string', 'job', 'Senior Software Engineer'),
('company_name', 'Name of the company', '{{company_name}}', 'string', 'company', 'Oracle Corporation'),
('interviewer_name', 'Name of the interviewer', '{{interviewer_name}}', 'string', 'interview', 'Jane Smith'),
('feedback_link', 'Link to submit feedback', '{{feedback_link}}', 'url', 'interview', 'https://app.manus.space/feedback/123'),
('engagement_score', 'Current engagement score', '{{engagement_score}}', 'number', 'candidate', '85');
