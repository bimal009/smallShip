import { auth } from "@/auth"
import { db } from "@/lib/database"
import { apps, appEnvKeys, appEnvKeyUpdateSchema } from "@/lib/database/schema"
import { headers } from "next/headers"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

type Context = { params: Promise<{ appId: string; keyId: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { appId, keyId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!z.uuid().safeParse(appId).success || !z.uuid().safeParse(keyId).success) {
      return NextResponse.json({ error: "Invalid app or environment key ID" }, { status: 400 })
    }
    const [app] = await db.select({ id: apps.id }).from(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id))).limit(1)
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const [key] = await db.select().from(appEnvKeys)
      .where(and(eq(appEnvKeys.appId, appId), eq(appEnvKeys.id, keyId))).limit(1)
    if (!key) return NextResponse.json({ error: "Environment key not found" }, { status: 404 })
    return NextResponse.json({ key }, { headers: { "Cache-Control": "private, no-store" } })
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

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { appId, keyId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!z.uuid().safeParse(appId).success || !z.uuid().safeParse(keyId).success) {
      return NextResponse.json({ error: "Invalid app or environment key ID" }, { status: 400 })
    }
    const [app] = await db.select({ id: apps.id }).from(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id))).limit(1)
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const result = appEnvKeyUpdateSchema.safeParse(await req.json())
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", issues: result.error.flatten() }, { status: 400 })
    }
    const [key] = await db.update(appEnvKeys).set(result.data)
      .where(and(eq(appEnvKeys.appId, appId), eq(appEnvKeys.id, keyId))).returning()
    if (!key) return NextResponse.json({ error: "Environment key not found" }, { status: 404 })
    return NextResponse.json({ key })
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

export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const { appId, keyId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!z.uuid().safeParse(appId).success || !z.uuid().safeParse(keyId).success) {
      return NextResponse.json({ error: "Invalid app or environment key ID" }, { status: 400 })
    }
    const [app] = await db.select({ id: apps.id }).from(apps)
      .where(and(eq(apps.id, appId), eq(apps.ownerId, session.user.id))).limit(1)
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const [key] = await db.delete(appEnvKeys)
      .where(and(eq(appEnvKeys.appId, appId), eq(appEnvKeys.id, keyId)))
      .returning({ id: appEnvKeys.id })
    if (!key) return NextResponse.json({ error: "Environment key not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    // Drizzle wraps database errors in a query error with the original cause.
    const cause = error instanceof Error && error.cause ? error.cause : error
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
      return NextResponse.json({ error: "Environment key already exists for this app" }, { status: 409 })
    }
    console.error("Environment key request failed:", error)
    return NextResponse.json({ error: "Environment key request failed" }, { status: 500 })
  }
}
