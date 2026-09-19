import { db } from "@/lib/database"
import { createHash } from "crypto"
import { apiKeys } from "@/lib/database/schema"
import { and, eq, isNull } from "drizzle-orm"

export async function verifyApiKeyToken(req: Request, bearerToken?: string) {
  if (!bearerToken) return undefined

  const keyHash = createHash("sha256").update(bearerToken).digest("hex")
  const [record] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1)

  if (!record) return undefined
  if (record.expiresAt && record.expiresAt < new Date()) return undefined

  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, record.id))
    .catch((err) => console.error("Failed to update lastUsedAt:", err))

  return { token: bearerToken, clientId: record.userId, scopes: [] }
}