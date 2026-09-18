import { auth } from "@/auth"
import { db } from "@/lib/database"
import { apps, appsInsertSchema } from "@/lib/database/schema"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { slugify } from "@/lib/slugify"
import { github } from "@/lib/gtihub"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const result = appsInsertSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: result.error.flatten() },
      { status: 400 }
    )
  }

  const slug = slugify(result.data.name)

  const octokit = await github.getInstallationOctokit(
    Number(process.env.GITHUB_APP_INSTALLATION_ID)
  )

  let repo
  try {
    const { data } = await octokit.request(
      "POST /repos/{template_owner}/{template_repo}/generate",
      {
        template_owner: process.env.GITHUB_ORG!,
        template_repo: "nextjs-app-template",
        owner: process.env.GITHUB_ORG!,
        name: slug,
        private: true,
      }
    )
    repo = data
  } catch (error) {
    console.error("Failed to create repo from template:", error)
    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    )
  }

  try {
    const [app] = await db
      .insert(apps)
      .values({
        ...result.data,
        ownerId: session.user.id,
        slug,
        githubInstallationId: process.env.GITHUB_APP_INSTALLATION_ID!,
        githubRepoFullName: repo.full_name,
        githubRepoId: String(repo.id),
      })
      .returning()

    return NextResponse.json({ app }, { status: 201 })
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
    return NextResponse.json(
      { error: "Failed to create app" },
      { status: 500 }
    )
  }
}