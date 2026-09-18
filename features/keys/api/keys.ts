export type ApiKeyRow = {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

export type CreatedKey = {
  id: string
  name: string
  key: string
}

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(typeof data?.error === "string" ? data.error : fallback)
  }
  return response.json()
}

export async function getKeys(signal?: AbortSignal): Promise<ApiKeyRow[]> {
  try {
    const response = await fetch("/api/keys", { signal, cache: "no-store" })
    const data = await readResponse<{ keys: ApiKeyRow[] }>(response, "Failed to load keys")
    return data.keys
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to load keys")
  }
}

export async function createKey(name: string): Promise<CreatedKey> {
  try {
    const response = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await readResponse<{ apiKey: CreatedKey }>(response, "Failed to create key")
    return data.apiKey
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to create key")
  }
}

export async function deleteKey(keyId: string): Promise<void> {
  try {
    const response = await fetch(`/api/keys/${encodeURIComponent(keyId)}`, {
      method: "DELETE",
    })
    await readResponse<{ success: boolean }>(response, "Failed to revoke key")
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to revoke key")
  }
}
