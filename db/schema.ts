import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  featureId: text("feature_id").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: text("options_json").notNull().default("{}"),
  resultsJson: text("results_json").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("generations_user_created_idx").on(table.userId, table.createdAt, table.id)]);

export const studioFiles = sqliteTable("studio_files", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  generationId: text("generation_id"),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  originalName: text("original_name").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("studio_files_user_generation_idx").on(table.userId, table.generationId)]);

export const preferences = sqliteTable("preferences", {
  userId: text("user_id").primaryKey(),
  favoritesJson: text("favorites_json").notNull().default("[]"),
  theme: text("theme").notNull().default("light"),
  language: text("language").$type<"id" | "en" | "ms">().notNull().default("id"),
  updatedAt: integer("updated_at").notNull(),
});

export const studioRateLimits = sqliteTable("studio_rate_limits", {
  id: text("id").primaryKey(),
  windowStartedAt: integer("window_started_at").notNull(),
  hits: integer("hits").notNull(),
});
