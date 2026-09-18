CREATE TABLE `calendar_sync_plans` (
	`account_id` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_sync_plans_code_idx` ON `calendar_sync_plans` (`code_hash`);