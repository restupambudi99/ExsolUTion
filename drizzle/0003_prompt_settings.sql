CREATE TABLE `studio_prompt_settings` (
	`feature_id` text PRIMARY KEY NOT NULL,
	`additional_instructions` text NOT NULL,
	`previous_instructions` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_change_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_prompt_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`feature_id` text NOT NULL,
	`previous_revision` integer NOT NULL,
	`revision` integer NOT NULL,
	`previous_instructions` text NOT NULL,
	`additional_instructions` text NOT NULL,
	`reason` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `studio_prompt_changes_created_idx` ON `studio_prompt_changes` (`created_at`,`id`);
