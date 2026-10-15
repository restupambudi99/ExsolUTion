CREATE TABLE `studio_file_cleanup` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_file_cleanup_object_key_unique` ON `studio_file_cleanup` (`object_key`);--> statement-breakpoint
CREATE INDEX `studio_file_cleanup_user_created_idx` ON `studio_file_cleanup` (`user_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `studio_generation_requests` (
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`generation_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response_json` text,
	`error_status` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `request_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_generation_requests_generation_id_unique` ON `studio_generation_requests` (`generation_id`);--> statement-breakpoint
CREATE INDEX `studio_requests_user_status_created_idx` ON `studio_generation_requests` (`user_id`,`status`,`created_at`);