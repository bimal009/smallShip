import type { AppOutput, appsUpdateSchema } from "@/lib/database/schema/apps"
import type { z } from "zod"

export type UpdateAppInput = z.infer<typeof appsUpdateSchema>




export async function getApps(): Promise<AppOutput[]> {
  const response = await fetch("/api/apps")

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to load apps"
    )
  }

  const data: { apps: AppOutput[] } = await response.json()
  return data.apps
}

export async function deleteApp(appId: string): Promise<void> {
  const response = await fetch(`/api/apps/${encodeURIComponent(appId)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to delete app"
    )
  }
}

export async function updateApp(appId: string, input: UpdateAppInput): Promise<AppOutput> {
  const response = await fetch(`/api/apps/${encodeURIComponent(appId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(typeof data?.error === "string" ? data.error : "Failed to update app")
  }

  const data: { app: AppOutput } = await response.json()
  return data.app
}
