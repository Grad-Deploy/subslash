ALTER TABLE `users` ADD `calendar_token_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_calendar_token_idx` ON `users` (`calendar_token_hash`);