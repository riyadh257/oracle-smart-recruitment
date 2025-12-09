CREATE TABLE `automation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger_id` int NOT NULL,
	`candidate_id` int NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL,
	`email_sent` boolean NOT NULL DEFAULT false,
	`error_message` text,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employer_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`event_type` enum('application_received','interview_scheduled','interview_completed','offer_extended','offer_accepted','offer_rejected','candidate_registered') NOT NULL,
	`template_id` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`conditions` text,
	`delay_minutes` int DEFAULT 0,
	`times_triggered` int NOT NULL DEFAULT 0,
	`last_triggered_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagement_alert_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employer_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`min_engagement_score` int NOT NULL DEFAULT 60,
	`score_drop_threshold` int NOT NULL DEFAULT 20,
	`time_window_days` int NOT NULL DEFAULT 7,
	`notify_email` boolean NOT NULL DEFAULT true,
	`notify_in_app` boolean NOT NULL DEFAULT true,
	`recipient_emails` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagement_alert_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagement_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_id` int NOT NULL,
	`candidate_id` int NOT NULL,
	`previous_score` int NOT NULL,
	`current_score` int NOT NULL,
	`score_drop` int NOT NULL,
	`alert_level` enum('warning','critical') NOT NULL,
	`status` enum('new','acknowledged','resolved') NOT NULL DEFAULT 'new',
	`acknowledged_by` int,
	`acknowledged_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagement_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`candidate_id` int NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`status` enum('pending','sent','delivered','failed') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`delivered_at` timestamp,
	`error_message` text,
	CONSTRAINT `sms_campaign_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employer_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`status` enum('draft','scheduled','sending','completed','cancelled') NOT NULL DEFAULT 'draft',
	`segmentation_rules` text,
	`scheduled_at` timestamp,
	`completed_at` timestamp,
	`total_recipients` int NOT NULL DEFAULT 0,
	`sent_count` int NOT NULL DEFAULT 0,
	`delivered_count` int NOT NULL DEFAULT 0,
	`failed_count` int NOT NULL DEFAULT 0,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_campaigns_id` PRIMARY KEY(`id`)
);
