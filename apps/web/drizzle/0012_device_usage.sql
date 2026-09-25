CREATE TABLE `usage_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`device_key` text NOT NULL,
	`platform` text NOT NULL,
	`label` text,
	`measured_from` integer NOT NULL,
	`measured_until` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_devices_account_device_idx` ON `usage_devices` (`account_id`,`device_key`);--> statement-breakpoint
CREATE INDEX `usage_devices_updated_idx` ON `usage_devices` (`updated_at`);--> statement-breakpoint
CREATE TABLE `usage_intervals` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`device_id` text NOT NULL,
	`service_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `usage_devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_intervals_device_start_idx` ON `usage_intervals` (`device_id`,`service_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `usage_intervals_account_start_idx` ON `usage_intervals` (`account_id`,`started_at`);