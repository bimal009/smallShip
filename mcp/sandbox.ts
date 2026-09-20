import { z } from "zod"
import fs from "fs/promises"
import path from "path"
import { eq } from "drizzle-orm"
import { initSandbox } from "@/core/sandbox"
import { getOwnedApp } from "./core/apps"
import { db } from "@/lib/database"
import { apps } from "@/lib/database/schema"
import { McpServer } from "@modelcontextprotocol/server"


export function registerSandboxTools(server: McpServer) {
  server.registerTool(
    "create-sandbox",
    {
      description: "Clone an app's repository and start its sandbox container",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async ({ appId }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: "text", text: "Unauthorized" }] }
      }

      const app = await getOwnedApp(appId, userId)
      if (!app) {
        return { isError: true, content: [{ type: "text", text: "App not found" }] }
      }

      let containerId: string
      let workspacePath: string

      try {
        const result = await initSandbox(appId, app.githubRepoFullName, app.githubBranch)
        containerId = result.containerId
        workspacePath = result.workspacePath
      } catch (error) {
        console.error("Failed to create sandbox:", error)
        return {
          isError: true,
          content: [{ type: "text", text: (error as Error).message }],
        }
      }

      try {
        await db.update(apps).set({ containerId, rootDir: workspacePath }).where(eq(apps.id, appId))
      } catch (error) {
        console.error("Failed to persist sandbox state:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Sandbox created but failed to save state" }],
        }
      }

      const conventions = await fs
        .readFile(path.join(workspacePath, "conventions.md"), "utf-8")
        .catch(() => "No conventions.md found for this app.")

      return {
        content: [
          { type: "text", text: JSON.stringify({ appId, containerId }) },
          { type: "text", text: `## Conventions for this app\n\n${conventions}` },
        ],
      }
    }
  )
}