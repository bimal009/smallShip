import { randomBytes, createHash } from "crypto"

export function generateApiKey() {
  const raw = `clk_live_${randomBytes(24).toString("hex")}` 
  const keyHash = createHash("sha256").update(raw).digest("hex")
  const keyPrefix = raw.slice(0, 16)
  return { raw, keyHash, keyPrefix }
}