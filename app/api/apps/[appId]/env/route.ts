import { auth } from "@/auth"
import { db } from "@/lib/database"
import { apps, appEnvKeys, appEnvKeyInsertSchema } from "@/lib/database/schema"
import { headers } from "next/headers"
import { z } from "zod"
import { and, asc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

type Context = { params: Promise<{ appId: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { appId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!z.uuid().safeParse(appId).success) {
      return NextResponse.json({ error: "Invalid app or environment key ID" }, { status: 400 })
    }
    const [app] = await db.select({ id: apps.id }).from(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id))).limit(1)
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const keys = await db.select().from(appEnvKeys)
      .where(eq(appEnvKeys.appId, appId)).orderBy(asc(appEnvKeys.key))
    return NextResponse.json({ keys }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const cause = error instanceof Error && error.cause ? error.cause : error
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
      return NextResponse.json({ error: "Environment key already exists for this app" }, { status: 409 })
    }
    console.error("Environment key request failed:", error)
    return NextResponse.json({ error: "Environment key request failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { appId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!z.uuid().safeParse(appId).success) {
      return NextResponse.json({ error: "Invalid app or environment key ID" }, { status: 400 })
    }
    const [app] = await db.select({ id: apps.id }).from(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id))).limit(1)
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const result = appEnvKeyInsertSchema.safeParse(await req.json())
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", issues: result.error.flatten() }, { status: 400 })
    }
    const [key] = await db.insert(appEnvKeys).values({ ...result.data, appId }).returning()
    return NextResponse.json({ key }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const cause = error instanceof Error && error.cause ? error.cause : error
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
      return NextResponse.json({ error: "Environment key already exists for this app" }, { status: 409 })
    }
    console.error("Environment key request failed:", error)
    return NextResponse.json({ error: "Environment key request failed" }, { status: 500 })
  }
}
