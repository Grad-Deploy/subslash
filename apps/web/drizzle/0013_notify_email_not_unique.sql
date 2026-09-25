DROP INDEX `notification_subscribers_email_idx`;--> statement-breakpoint
CREATE INDEX `notification_subscribers_email_idx` ON `notification_subscribers` (`email`);