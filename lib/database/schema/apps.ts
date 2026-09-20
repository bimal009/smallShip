import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { user } from "./user";
import { hosts } from "./hosts";

export const appStatusEnum = pgEnum("app_status", [
  "creating",
  "building",
  "running",
  "sleeping",
  "failed",
  "deleted",
]);

export const apps = pgTable(
  "apps",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    hostId: uuid("host_id").references(() => hosts.id, {
      onDelete: "restrict",
    }),

    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),

    githubInstallationId: text("github_installation_id").notNull(),
    githubRepoId: text("github_repo_id").notNull(),
    githubRepoFullName: text("github_repo_full_name").notNull(),
    githubBranch: text("github_branch").default("main").notNull(),
    rootDir: text("root_dir").default("/").notNull(),

    status: appStatusEnum("status").default("creating").notNull(),

    containerId: text("container_id"),
    port: integer("port"),

    lastDeployedAt: timestamp("last_deployed_at"),
    lastActiveAt: timestamp("last_active_at"),

    customDomain: text("custom_domain"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    repoIdx: uniqueIndex("apps_github_repo_idx").on(
      table.githubInstallationId,
      table.githubRepoId
    ),

    hostPortIdx: uniqueIndex("apps_host_port_idx").on(
      table.hostId,
      table.port
    ),
  })
);

export const appsInsertSchema = createInsertSchema(apps, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "App name is required")
      .max(100, "App name must be at most 100 characters"),

} ) .omit({
    id: true,

    ownerId: true,

    hostId: true,

    slug: true,

    githubInstallationId: true,
    githubBranch: true,
    githubRepoFullName: true,
    githubRepoId: true,

    status: true,
    containerId: true,
    port: true,
    lastDeployedAt: true,
    lastActiveAt: true,
    customDomain:true,
    rootDir:true,

    createdAt: true,
    updatedAt: true,
  })
  .strict();

export type CreateAppInput = z.infer<typeof appsInsertSchema>;

export const appsUpdateSchema = createUpdateSchema(apps, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "App name is required")
      .max(100, "App name must be at most 100 characters"),

} ) .omit({
    id: true,

    ownerId: true,

    hostId: true,

    slug: true,

    githubInstallationId: true,
    githubBranch: true,
    githubRepoFullName: true,
    githubRepoId: true,

    status: true,
    containerId: true,
    port: true,
    lastDeployedAt: true,
    lastActiveAt: true,
    customDomain:true,
    rootDir:true,

    createdAt: true,
    updatedAt: true,
  })
  .strict();