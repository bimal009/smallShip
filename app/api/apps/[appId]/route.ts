import { auth } from "@/auth"
import { db } from "@/lib/database"
import { apps, appsUpdateSchema } from "@/lib/database/schema"
import { github } from "@/lib/github"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { appId } = await params

    if (!z.uuid().safeParse(appId).success) {
      return NextResponse.json({ error: "Invalid app ID" }, { status: 400 })
    }


    const [app]= await db.select().from(apps).where(and(eq(apps.id,appId),eq(apps.ownerId,session.user.id))).limit(1)

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const [owner, repo] = app.githubRepoFullName.split("/")
    try {
      const octokit = await github.getInstallationOctokit(
        Number(process.env.GITHUB_APP_INSTALLATION_ID)
      )
      await octokit.request("DELETE /repos/{owner}/{repo}", { owner, repo })
      
    } catch (error) {
      console.error("Failed to delete GitHub repo (continuing anyway):", error)
    }

    await db
      .delete(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id)))



    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete app:", error)
    return NextResponse.json({ error: "Failed to delete app" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { appId } = await params

    if (!z.uuid().safeParse(appId).success) {
      return NextResponse.json({ error: "Invalid app ID" }, { status: 400 })
    }

    const body = await req.json()
    const result = appsUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: result.error.flatten() },
        { status: 400 }
      )
    }

    const [app] = await db
      .select()
      .from(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id)))
      .limit(1)

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const [updated] = await db
      .update(apps)
      .set(result.data)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id)))
      .returning()

    return NextResponse.json({ app: updated })
  } catch (error) {
    console.error("Failed to update app:", error)
    return NextResponse.json(
      { error: "Failed to update app" },
      { status: 500 }
    )
  }
}