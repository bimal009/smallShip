import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { initSandbox } from "@/core/sandbox"
import { getOwnedApp } from "./core/apps"

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
      if (!userId) throw new Error("Unauthorized")

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return {
            isError: true,
            content: [{ type: "text", text: "App not found" }],
          }
        }

        const containerId = await initSandbox(
          appId,
          app.githubRepoFullName,
          app.githubBranch
        )
        return {
          content: [{ type: "text", text: JSON.stringify({ appId, containerId }) }],
        }
      } catch (error) {
        console.error("Failed to create sandbox:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to create sandbox" }],
        }
      }
    }
  )
}
