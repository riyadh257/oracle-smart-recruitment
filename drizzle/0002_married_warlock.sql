ALTER TABLE `users` ADD `calendarProvider` enum('google','outlook') DEFAULT 'google';--> statement-breakpoint
ALTER TABLE `users` ADD `outlookUserId` varchar(320);