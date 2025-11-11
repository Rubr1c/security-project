CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`message` text NOT NULL,
	`meta` text,
	`error` text,
	`level` text NOT NULL
);
