import { appsInsertSchema, apps } from "@/lib/database/schema"
import { db } from "@/lib/database"
import { slugify } from "@/lib/slugify"
import { github } from "@/lib/github"
import { McpServer } from "@modelcontextprotocol/server"

export function registerMcpTools(server: McpServer) {
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

        return { content: [{ type: "text", text: JSON.stringify(app) }] }
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