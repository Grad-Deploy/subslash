CREATE TABLE `account_snapshots` (
	`account_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`subscription_count` integer NOT NULL,
	`saved_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
