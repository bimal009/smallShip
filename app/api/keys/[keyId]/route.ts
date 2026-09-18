import { auth } from "@/auth"
import { db } from "@/lib/database"
import { apiKeys } from "@/lib/database/schema"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { keyId } = await params

  const existing = await db.query.apiKeys.findFirst({
    where: { id: keyId, userId: session.user.id },
    columns: { id: true, revokedAt: true },
  })

  if (!existing) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 })
  }

  if (existing.revokedAt) {
    return NextResponse.json({ error: "Key already revoked" }, { status: 409 })
  }

  try {
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Failed to revoke key:", error)
    return NextResponse.json(
      { error: "Failed to revoke key" },
      { status: 500 }
    )
  }
}