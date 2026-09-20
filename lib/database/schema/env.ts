import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { apps } from "./apps";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

export const appEnvKeys = pgTable(
  "app_env_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    description: text("description"),
    hasValue: boolean("has_value").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    appKeyIdx: uniqueIndex("app_env_keys_app_key_idx").on(table.appId, table.key),
  })
)

export const appEnvKeyInsertSchema = createInsertSchema(appEnvKeys, {
  key: z.string().trim().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Invalid environment variable name"),
}).pick({ key: true, description: true, hasValue: true }).strict();

export const appEnvKeyUpdateSchema = appEnvKeyInsertSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);
