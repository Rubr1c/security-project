ALTER TABLE `users` ADD `email_verified_at` text DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `otp_hash` text DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `otp_expires_at` text DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `otp_last_sent_at` text DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `otp_attempts` integer DEFAULT 0 NOT NULL;