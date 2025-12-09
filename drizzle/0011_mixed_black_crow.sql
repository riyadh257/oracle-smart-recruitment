CREATE TABLE `engagement_alert_instances` (
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
	CONSTRAINT `engagement_alert_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `engagement_alerts`;