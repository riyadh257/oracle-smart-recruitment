ALTER TABLE `candidatePreferences` ADD `emailNotificationsEnabled` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `candidatePreferences` ADD `inAppNotificationsEnabled` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `candidatePreferences` ADD `profileVisibility` enum('public','private','employers_only') DEFAULT 'employers_only';--> statement-breakpoint
ALTER TABLE `candidatePreferences` ADD `allowDataSharing` boolean DEFAULT true;