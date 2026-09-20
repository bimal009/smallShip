import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { db } from "@/lib/database"
import { appEnvKeys, appEnvKeysBulkInsertSchema } from "@/lib/database/schema"
import { getOwnedApp } from "./core/apps"

export function registerEnvTools(server: McpServer) {
  server.registerTool(
    "create-env-keys",
    {
      description: "Create environment key names in bulk for an app owned by the authenticated user. Stores names only, not secret values. Duplicate names reject the entire batch.",
      inputSchema: appEnvKeysBulkInsertSchema.extend({ appId: z.uuid() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ appId, keys }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: "text", text: "Unauthorized" }] }
      }

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return { isError: true, content: [{ type: "text", text: "App not found" }] }
        }

        const createdKeys = await db.insert(appEnvKeys)
          .values(keys.map(({ key }) => ({ appId, key })))
          .returning()

        return { content: [{ type: "text", text: JSON.stringify({ keys: createdKeys }) }] }
      } catch (error) {
        const cause = error instanceof Error && error.cause ? error.cause : error
        if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
          return {
            isError: true,
            content: [{ type: "text", text: "Environment key already exists for this app; no keys were created" }],
          }
        }
        console.error("Failed to create environment keys:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to create environment keys" }],
        }
      }
    }
  )
}
