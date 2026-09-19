import type { apps } from "@/lib/database/schema/apps"

type AppRecord = typeof apps.$inferSelect

export type AppRow = {
  [Key in keyof AppRecord]: AppRecord[Key] extends Date | null
    ? string | Extract<AppRecord[Key], null>
    : AppRecord[Key]
}

export async function getApps(): Promise<AppRow[]> {
  const response = await fetch("/api/apps")

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to load apps"
    )
  }

  const data: { apps: AppRow[] } = await response.json()
  return data.apps
}
