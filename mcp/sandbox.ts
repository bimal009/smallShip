import { z } from "zod"
import fs from "fs/promises"
import path from "path"
import { destroySandbox, initSandbox } from "@/core/sandbox"
import { getOwnedApp } from "./core/apps"
import { McpServer } from "@modelcontextprotocol/server"


export function registerSandboxTools(server: McpServer) {
  server.registerTool(
    "destroy-sandbox",
    {
      description: "Stop and remove only the app's code-editing sandbox and its workspace, including uncommitted files. Build containers, production containers, the app, and its GitHub repository are retained.",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
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

        await destroySandbox(appId)
      } catch (error) {
        console.error("Failed to destroy sandbox:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to destroy sandbox" }],
        }
      }


      return { content: [{ type: "text", text: JSON.stringify({ appId, success: true }) }] }
    }
  )

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
