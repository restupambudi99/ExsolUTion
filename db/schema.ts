import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

// A request receipt survives a lost browser connection. It is not a background job:
// a pending receipt can become unknown if the Worker was interrupted.
export const studioGenerationRequests = sqliteTable("studio_generation_requests", {
  userId: text("user_id").notNull(),
  requestId: text("request_id").notNull(),
  fingerprint: text("fingerprint").notNull(),
  generationId: text("generation_id").notNull().unique(),
  status: text("status").$type<"pending" | "completed" | "failed">().notNull().default("pending"),
  responseJson: text("response_json"),
  errorStatus: integer("error_status"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.requestId] }),
  index("studio_requests_user_status_created_idx").on(table.userId, table.status, table.createdAt),
]);

export const studioFileCleanup = sqliteTable("studio_file_cleanup", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  objectKey: text("object_key").notNull().unique(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("studio_file_cleanup_user_created_idx").on(table.userId, table.createdAt, table.id)]);
