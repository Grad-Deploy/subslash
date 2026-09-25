CREATE TABLE `stats_contributors` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`total_monthly_krw` integer NOT NULL,
	`active_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stats_contributors_token_idx` ON `stats_contributors` (`token_hash`);--> statement-breakpoint
CREATE INDEX `stats_contributors_updated_idx` ON `stats_contributors` (`updated_at`);--> statement-breakpoint
CREATE TABLE `stats_items` (
	`id` text PRIMARY KEY NOT NULL,
	`contributor_id` text NOT NULL,
	`preset_id` text NOT NULL,
	`monthly_krw` integer NOT NULL,
	`usage_count` integer,
	FOREIGN KEY (`contributor_id`) REFERENCES `stats_contributors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stats_items_contributor_idx` ON `stats_items` (`contributor_id`);--> statement-breakpoint
CREATE INDEX `stats_items_preset_idx` ON `stats_items` (`preset_id`);