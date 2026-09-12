ALTER TABLE `users` RENAME TO `notification_subscribers`;--> statement-breakpoint
DROP INDEX IF EXISTS `users_email_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `users_sync_token_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `users_calendar_token_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `notification_subscribers_email_idx` ON `notification_subscribers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `notification_subscribers_sync_token_idx` ON `notification_subscribers` (`sync_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `notification_subscribers_calendar_token_idx` ON `notification_subscribers` (`calendar_token_hash`);
