CREATE TABLE `mirrored_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'KRW' NOT NULL,
	`billing_day` integer NOT NULL,
	`billing_cycle` text DEFAULT 'monthly' NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mirrored_subs_user_client_idx` ON `mirrored_subscriptions` (`user_id`,`client_id`);--> statement-breakpoint
CREATE INDEX `mirrored_subs_billing_day_idx` ON `mirrored_subscriptions` (`billing_day`);--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`billing_date` text NOT NULL,
	`sent_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_log_once_idx` ON `notification_log` (`user_id`,`client_id`,`billing_date`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`sync_token_hash` text NOT NULL,
	`verified_at` text,
	`reminder_days` integer DEFAULT 3 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_synced_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_sync_token_idx` ON `users` (`sync_token_hash`);