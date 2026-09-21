import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { installPnpm, buildPnpm } from "@/core/pnpm"
import { getOwnedApp } from "./core/apps"
import { getSandboxContainerId } from "@/core/sandbox"

export function registerPnpmTools(server: McpServer) {
  server.registerTool(
    "pnpm-install",
    {
      description: "Install dependencies inside the app sandbox. Requires an active sandbox created via create-sandbox.",
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

        const result = await installPnpm(containerId)
        return {
          isError: result.exitCode !== 0,
          content: [{ type: "text", text: JSON.stringify(result) }],
        }
      } catch (error) {
        console.error("Failed to install dependencies", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to install dependencies" }],
        }
      }
    }
  )

  server.registerTool(
    "pnpm-build",
    {
      description: "Build the app inside its active sandbox. Run pnpm-install first when dependencies need installing.",
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

        const result = await buildPnpm(containerId)
        return {
          isError: result.exitCode !== 0,
          content: [{ type: "text", text: JSON.stringify(result) }],
        }
      } catch (error) {
        console.error("Failed to build app", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to build app" }],
        }
      }
    }
  )
}
