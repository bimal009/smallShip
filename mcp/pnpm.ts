import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { installAndBuildPnpm } from "@/core/pnpm"
import { getOwnedApp } from "./core/apps"
import { getSandboxContainerId } from "@/core/sandbox"

export function registerPnpmTools(server: McpServer) {
  server.registerTool(
    "pnpm-install-and-build",
    {
      description:
        "Install dependencies and build the app inside its active sandbox. Use this while writing code, after file changes, to verify the app builds. Build runs only if installation succeeds. Requires an active sandbox created via create-sandbox.",
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

        const containerId = await getSandboxContainerId(appId)
        if (!containerId) {
          return { isError: true, content: [{ type: "text", text: "No active sandbox for this app. Call create-sandbox first." }] }
        }

        const result = await installAndBuildPnpm(containerId)
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