CREATE TABLE `account_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider` text NOT NULL,
	`subject_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_identities_subject_idx` ON `account_identities` (`provider`,`subject_hash`);--> statement-breakpoint
CREATE INDEX `account_identities_account_idx` ON `account_identities` (`account_id`);--> statement-breakpoint
CREATE TABLE `oauth_app_claims` (
	`challenge` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
