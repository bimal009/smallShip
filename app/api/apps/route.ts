import { db } from "@/lib/database/db"
import { apps, appsInsertSchema } from "@/lib/database/schema"
import { auth } from "@/lib/auth" // adjust to whatever you're using for sessions
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
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

  const [app] = await db
    .insert(apps)
    .values({
      ...result.data,
      ownerId: session.user.id,
    })
    .returning()

  return NextResponse.json({ app }, { status: 201 })
}