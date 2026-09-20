import { McpServer } from "@modelcontextprotocol/server"

import { deleteFile, readFile, listFiles, writeFile, editFile } from "@/core/fs"
import { readFileSchema, writeFileSchema, deleteFileSchema, listFilesSchema, editFileSchema } from "@/core/schemas"
import { getOwnedApp } from "./core/apps"

export function registerFileTools(server: McpServer) {
  server.registerTool(
    "edit-file",
    {
      description: "Replace a unique string in a file in an app's sandbox",
      inputSchema: editFileSchema,
    },
    async ({ appId, path, oldStr, newStr }, extra) => {
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
        await editFile(appId, path, oldStr, newStr)
        return { content: [{ type: "text", text: `Edited ${path}` }] }
      } catch (error) {
        console.error("Failed to edit file:", error)
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to edit ${path}` }],
        }
      }
    }
  )


  server.registerTool(
    "get-file",
    {
      description: "Read a file's contents from an app's sandbox",
      inputSchema: readFileSchema,
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
        const file = await readFile(appId, path)
        return { content: [{ type: "text", text: file }] }
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
      description: "List directory entries in an app's sandbox",
      inputSchema: listFilesSchema,
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
        const files = await listFiles(appId, path)
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
      description: "Create or update a file in an app's sandbox",
      inputSchema: writeFileSchema,
    },
    async ({ appId, path, content }, extra) => {
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
        await writeFile(appId, path, content)
        return {
          content: [
            { type: "text", text: `Updated ${path}` },
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
      description: "Delete a file from an app's sandbox",
      inputSchema: deleteFileSchema,
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
        await deleteFile(appId, path)
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
