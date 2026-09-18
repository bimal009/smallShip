import { randomBytes, createHash } from "crypto"
import { apiKeys } from "../database/schema"
import { eq } from "drizzle-orm"
import { db } from "../database"

export function generateApiKey() {
  const raw = `clk_live_${randomBytes(24).toString("hex")}` 
  const keyHash = createHash("sha256").update(raw).digest("hex")
  const keyPrefix = raw.slice(0, 16)
  return { raw, keyHash, keyPrefix }
}

export async function verifyApiKey(rawKey: string) {
  const keyHash = createHash("sha256").update(rawKey).digest("hex")

  const record = await db.query.apiKeys.findFirst({
    where: { keyHash},
  })

  if (!record) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null

  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, record.id))

  return record
}