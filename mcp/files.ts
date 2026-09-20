import { db } from "@/lib/database"
import { apps } from "@/lib/database/schema"
import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { deleteFile, getFile, listFiles, upsertFile } from "@/lib/github/files"
import { getOwnedApp } from "./core/apps"

export function registerFileTools(server: McpServer) {


  server.registerTool(
    "get-file",
    {
      description: "Read a file's contents from an app's repo",
      inputSchema: z.object({
        appId: z.uuid(),
        path: z.string().min(1),
      }).strict(),
      annotations: { readOnlyHint: true },
    },
    async ({ appId, path }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) throw new Error("Unauthorized")

      const app = await getOwnedApp(appId, userId)
      if (!app) {
        return {
          isError: true,
          content: [{ type: "text", text: "App not found" }],
        }
      }

      try {
        const file = await getFile(app.githubRepoFullName, path, app.githubBranch)
        return { content: [{ type: "text", text: file.content }] }
      } catch (error) {
        console.error("Failed to read file:", error)
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to read ${path}` }],
        }
      }
    }
  )

  server.registerTool(
    "list-files",
    {
      description: "List all files in an app's repo",
      inputSchema: z.object({ appId: z.uuid() }).strict(),
      annotations: { readOnlyHint: true },
    },
    async ({ appId }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) throw new Error("Unauthorized")

      const app = await getOwnedApp(appId, userId)
      if (!app) {
        return {
          isError: true,
          content: [{ type: "text", text: "App not found" }],
        }
      }

      try {
        const files = await listFiles(app.githubRepoFullName, app.githubBranch)
        return { content: [{ type: "text", text: JSON.stringify({ files }) }] }
      } catch (error) {
        console.error("Failed to list files:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to list files" }],
        }
      }
    }
  )

  server.registerTool(
    "add-or-update-file",
    {
      description: "Create or update a file in an app's repo",
      inputSchema: z.object({
        appId: z.uuid(),
        path: z.string().min(1),
        content: z.string(),
        message: z.string().optional(),
      }).strict(),
    },
    async ({ appId, path, content, message }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) throw new Error("Unauthorized")

      const app = await getOwnedApp(appId, userId)
      if (!app) {
        return {
          isError: true,
          content: [{ type: "text", text: "App not found" }],
        }
      }

      try {
        const result = await upsertFile(
          app.githubRepoFullName,
          path,
          content,
          app.githubBranch,
          message
        )
        return {
          content: [
            { type: "text", text: `Updated ${path}, commit ${result.commit.sha}` },
          ],
        }
      } catch (error) {
        console.error("Failed to update file:", error)
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to update ${path}` }],
        }
      }
    }
  )

  server.registerTool(
    "delete-file",
    {
      description: "Delete a file from an app's repo",
      inputSchema: z.object({
        appId: z.uuid(),
        path: z.string().min(1),
        message: z.string().optional(),
      }).strict(),
    },
    async ({ appId, path, message }, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) throw new Error("Unauthorized")

      const app = await getOwnedApp(appId, userId)
      if (!app) {
        return {
          isError: true,
          content: [{ type: "text", text: "App not found" }],
        }
      }

      try {
        await deleteFile(app.githubRepoFullName, path, app.githubBranch, message)
        return { content: [{ type: "text", text: `Deleted ${path}` }] }
      } catch (error) {
        console.error("Failed to delete file:", error)
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete ${path}` }],
        }
      }
    }
  )
}