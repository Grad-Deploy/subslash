CREATE TABLE `ask_daily_counts` (
	`account_id` text NOT NULL,
	`day` text NOT NULL,
	`scope` text NOT NULL,
	`count` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ask_daily_counts_account_day_scope_idx` ON `ask_daily_counts` (`account_id`,`day`,`scope`);--> statement-breakpoint
CREATE INDEX `ask_daily_counts_day_idx` ON `ask_daily_counts` (`day`);