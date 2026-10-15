CREATE TABLE `studio_provider_credentials` (
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`encrypted_key` text,
	`iv` text,
	`config_json` text NOT NULL,
	`expires_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`revision` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `provider`)
);
