import { db } from "@/lib/database"
import { apps } from "@/lib/database/schema"
import { and, eq } from "drizzle-orm"

export async function getOwnedApp(appId: string, userId: string) {
  const [app] = await db
    .select({
      githubRepoFullName: apps.githubRepoFullName,
      githubBranch: apps.githubBranch,
    })
    .from(apps)
    .where(and(eq(apps.id, appId), eq(apps.ownerId, userId)))
    .limit(1)

  return app
}