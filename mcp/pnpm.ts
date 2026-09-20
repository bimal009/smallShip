import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { installAndBuildPnpm } from "@/core/pnpm"
import { getOwnedApp } from "./core/apps"

export function registerPnpmTools(server: McpServer) {
  server.registerTool(
    "pnpm-install-and-build",
    {
      description: "Install dependencies with pnpm and then build an app in its sandbox. Build runs only if installation succeeds.",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async ({ appId }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: "text", text: "Unauthorized" }] }
      }

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return { isError: true, content: [{ type: "text", text: "App not found" }] }
        }

        const result = await installAndBuildPnpm(appId)
        return {
          isError: result.exitCode !== 0,
          content: [{ type: "text", text: JSON.stringify(result) }],
        }
      } catch (error) {
        console.error("Failed to install dependencies and build app:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to install dependencies and build app" }],
        }
      }
    }
  )
}
