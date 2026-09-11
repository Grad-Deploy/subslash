CREATE TABLE `verification_mail_log` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`sent_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_mail_log_email_idx` ON `verification_mail_log` (`email`,`sent_at`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `email_verified_at` text;