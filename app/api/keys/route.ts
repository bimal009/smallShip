import { auth } from "@/auth"
import { db } from "@/lib/database"
import { apiKeys, createApiKeySchema } from "@/lib/database/schema"
import { generateApiKey } from "@/lib/helpers/keys"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"



export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const result = createApiKeySchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const { raw, keyHash, keyPrefix } = generateApiKey()

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        id: randomUUID(),
        userId: session.user.id,
        name: result.data.name,
        keyHash,
        keyPrefix,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
      })

    return NextResponse.json({ apiKey: { ...apiKey, key: raw } }, { status: 201 })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    )
  }
}