import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { createInsertSchema } from "drizzle-orm/zod";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(), 
    keyHash: text("key_hash").notNull().unique(), 
    keyPrefix: text("key_prefix").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("api_keys_userId_idx").on(table.userId),
    index("api_keys_keyHash_idx").on(table.keyHash),
  ],
);

export const createApiKeySchema = createInsertSchema(apiKeys, {
  name: (schema) => schema.min(1).max(30),
}).omit({
  id: true,
  userId: true,
  keyHash: true,
  keyPrefix: true,
  lastUsedAt: true,
  expiresAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
});