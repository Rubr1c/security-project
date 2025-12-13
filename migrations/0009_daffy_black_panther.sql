ALTER TABLE `users` ADD `login_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `login_locked_until` text DEFAULT NULL;