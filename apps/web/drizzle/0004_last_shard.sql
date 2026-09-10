DROP INDEX IF EXISTS "accounts_username_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "accounts_email_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "mirrored_subs_user_client_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "mirrored_subs_billing_day_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notification_log_once_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sessions_token_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sessions_account_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "users_sync_token_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "users_calendar_token_idx";--> statement-breakpoint
ALTER TABLE `accounts` ALTER COLUMN "age" TO "age" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_idx` ON `accounts` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_idx` ON `accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `mirrored_subs_user_client_idx` ON `mirrored_subscriptions` (`user_id`,`client_id`);--> statement-breakpoint
CREATE INDEX `mirrored_subs_billing_day_idx` ON `mirrored_subscriptions` (`billing_day`);--> statement-breakpoint
CREATE UNIQUE INDEX `notification_log_once_idx` ON `notification_log` (`user_id`,`client_id`,`billing_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_account_idx` ON `sessions` (`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_sync_token_idx` ON `users` (`sync_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_calendar_token_idx` ON `users` (`calendar_token_hash`);--> statement-breakpoint
ALTER TABLE `accounts` ALTER COLUMN "gender" TO "gender" text;