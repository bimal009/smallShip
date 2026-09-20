import { appsInsertSchema, apps } from "@/lib/database/schema"
import { db } from "@/lib/database"
import { slugify } from "@/lib/slugify"
import { github } from "@/lib/github"
import { McpServer } from "@modelcontextprotocol/server"
import { z } from "zod"

export function registerMcpTools(server: McpServer) {
  server.registerTool(
    "get-apps",
    {
      description: "Get all apps owned by the authenticated user, newest first",
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true },
    },
    async (_input, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        throw new Error("Unauthorized")
      }

      try {
        const userApps = await db.query.apps.findMany({
          where: { ownerId: userId },
          orderBy: (apps, { desc }) => [desc(apps.createdAt)],
        })

        return { content: [{ type: "text", text: JSON.stringify({ apps: userApps }) }] }
      } catch (error) {
        console.error("Failed to load apps:", error)
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to load apps" }],
        }
      }
    }
  )

  server.registerTool(
    "create-app",
    {
      description: "Create an app",
      inputSchema: appsInsertSchema,
    },
    async (input, extra) => {
      const userId = extra.http?.authInfo?.clientId
      if (!userId) {
        throw new Error("Unauthorized")
      }

      const slug = slugify(input.name)
      const octokit = await github.getInstallationOctokit(
        Number(process.env.GITHUB_APP_INSTALLATION_ID)
      )

      const { data: repo } = await octokit.request(
        "POST /repos/{template_owner}/{template_repo}/generate",
        {
          template_owner: process.env.GITHUB_ORG!,
          template_repo: "nextjs-app-template",
          owner: process.env.GITHUB_ORG!,
          name: slug,
          private: true,
        }
      )

      try {
        const [app] = await db
          .insert(apps)
          .values({
            ...input,
            ownerId: userId,
            slug,
            githubInstallationId: process.env.GITHUB_APP_INSTALLATION_ID!,
            githubRepoFullName: repo.full_name,
            githubRepoId: String(repo.id),
          })
          .returning()

        return {
  content: [
    {
      type: "text",
      text: JSON.stringify(app) + "\n\nBefore writing code, read the resource shipsmall://template/conventions for this template's conventions.",
    },
  ],
}
      } catch (error) {
        console.error("Failed to create app row, rolling back repo:", error)
        try {
          await octokit.request("DELETE /repos/{owner}/{repo}", {
            owner: process.env.GITHUB_ORG!,
            repo: repo.name,
          })
        } catch (cleanupError) {
          console.error("Failed to clean up orphaned repo:", cleanupError)
        }
        throw error
      }
    }


  )
}
