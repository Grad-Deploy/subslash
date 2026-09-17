CREATE TABLE `gmail_discoveries` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`billing_day` integer NOT NULL,
	`billing_cycle` text NOT NULL,
	`billing_month` integer,
	`category` text NOT NULL,
	`preset_id` text,
	`payment_method` text,
	`receipt_date` text NOT NULL,
	`sender` text NOT NULL,
	`tier` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gmail_discoveries_account_key_idx` ON `gmail_discoveries` (`account_id`,`dedupe_key`);--> statement-breakpoint
CREATE TABLE `gmail_import_links` (
	`account_id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`last_ingest_at` text,
	`last_email_count` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gmail_import_links_token_idx` ON `gmail_import_links` (`token_hash`);