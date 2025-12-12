ALTER TABLE `users` ADD `password_reset_token` text DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password_reset_token_expires_at` text DEFAULT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_password_reset_token_unique` ON `users` (`password_reset_token`);