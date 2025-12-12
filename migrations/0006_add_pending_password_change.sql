ALTER TABLE `users` ADD `pending_password_hash` text DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pending_password_expires_at` text DEFAULT NULL;