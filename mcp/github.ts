import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { getDiff, gitPush, gitStatus } from "@/core/github"
import { getOwnedApp } from "./core/apps"

export function registerGithubTools(server: McpServer) {
  server.registerTool(
    "git-status",
    {
      description: "Get the Git status of an app's sandbox",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: true },
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

        const status = await gitStatus(appId)
        return { content: [{ type: "text", text: JSON.stringify(status) }] }
      } catch {
        return { isError: true, content: [{ type: "text", text: "Failed to get Git status" }] }
      }
    }
  )

  server.registerTool(
    "git-diff",
    {
      description: "Get tracked file changes against HEAD in an app's sandbox, optionally for one file",
      inputSchema: z.object({
        appId: z.uuid(),
        filePath: z.string().min(1).optional(),
      }).strict(),
      annotations: { readOnlyHint: true },
    },
    async ({ appId, filePath }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: "text", text: "Unauthorized" }] }
      }

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return { isError: true, content: [{ type: "text", text: "App not found" }] }
        }

        const diff = await getDiff(appId, filePath)
        return { content: [{ type: "text", text: diff }] }
      } catch {
        return { isError: true, content: [{ type: "text", text: "Failed to get Git diff" }] }
      }
    }
  )

  server.registerTool(
    "git-push",
    {
      description: "Stage all sandbox changes, commit with the supplied message, and push to the app's repository. Review git-status and git-diff first. If the workspace is clean, no commit or push is performed.",
      inputSchema: z.object({
        appId: z.uuid(),
        message: z.string().trim().min(1),
      }).strict(),
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async ({ appId, message }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        return { isError: true, content: [{ type: "text", text: "Unauthorized" }] }
      }

      try {
        const app = await getOwnedApp(appId, userId)
        if (!app) {
          return { isError: true, content: [{ type: "text", text: "App not found" }] }
        }

        const result = await gitPush(appId, message, userId)
        return { content: [{ type: "text", text: JSON.stringify(result) }] }
      } catch {
        return { isError: true, content: [{ type: "text", text: "Failed to commit and push changes" }] }
      }
    }
  )
}
