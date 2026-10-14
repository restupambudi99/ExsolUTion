CREATE TABLE `generations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`feature_id` text NOT NULL,
	`prompt` text NOT NULL,
	`options_json` text DEFAULT '{}' NOT NULL,
	`results_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `generations_user_created_idx` ON `generations` (`user_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`favorites_json` text DEFAULT '[]' NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`language` text DEFAULT 'id' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text,
	`object_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`original_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_files_object_key_unique` ON `studio_files` (`object_key`);--> statement-breakpoint
CREATE INDEX `studio_files_user_generation_idx` ON `studio_files` (`user_id`,`generation_id`);--> statement-breakpoint
CREATE TABLE `studio_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`hits` integer NOT NULL
);
