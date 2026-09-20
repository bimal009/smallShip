import { McpServer } from "@modelcontextprotocol/server"
import { and, eq, ne } from "drizzle-orm"
import { z } from "zod"
import { deployApp } from "@/core/deploy"
import { db } from "@/lib/database"
import { apps } from "@/lib/database/schema"

export function registerDeployTools(server: McpServer) {
  server.registerTool("deploy-app", {
    description: "Build the latest pushed commit of an owned app's configured repository and branch, then start its production container. Push changes first. Does not replace an existing running deployment.",
    inputSchema: z.object({ appId: z.uuid() }).strict(),
    annotations: { readOnlyHint: false, idempotentHint: false },
  }, async ({ appId }, extra) => {
    const userId = extra.http?.authInfo?.clientId
    if (!userId) return { isError: true, content: [{ type: "text", text: "Unauthorized" }] }

    const owned = and(eq(apps.id, appId), eq(apps.ownerId, userId))
    let claimed = false
    let started = false
    try {
      const [app] = await db.select().from(apps).where(owned).limit(1)
      if (!app) return { isError: true, content: [{ type: "text", text: "App not found" }] }
      if (app.status === "running" || app.status === "building" || app.status === "deleted") {
        return { isError: true, content: [{ type: "text", text: `Cannot deploy an app with status ${app.status}` }] }
      }
      const [claim] = await db.update(apps).set({ status: "building" })
        .where(and(owned, ne(apps.status, "building"), ne(apps.status, "running"), ne(apps.status, "deleted")))
        .returning({ id: apps.id })
      if (!claim) return { isError: true, content: [{ type: "text", text: "App state changed; deployment was not started" }] }
      claimed = true

      const result = await deployApp(appId, app.githubRepoFullName, app.githubBranch, () => {})
      started = true
      const [saved] = await db.update(apps).set({
        status: "running", containerId: result.containerId, port: result.port,
        lastDeployedAt: new Date(), lastActiveAt: new Date(),
      }).where(owned).returning({ id: apps.id })
      if (!saved) throw new Error("Deployment state could not be saved")
      return { content: [{ type: "text", text: JSON.stringify({ appId, ...result, status: "running" }) }] }
    } catch (error) {
      console.error("Deployment failed:", error)
      if (claimed && !started) {
        await db.update(apps).set({ status: "failed" }).where(owned)
          .catch((saveError) => console.error("Failed to save deployment failure:", saveError))
      }
      return { isError: true, content: [{ type: "text", text: started
        ? "Container started, but deployment state could not be saved. Inspect the deployment before retrying."
        : "Deployment failed. Check server deployment logs for details." }] }
    }
  })
}
