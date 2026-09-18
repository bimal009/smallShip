import { auth } from "@/auth"
import { KeysForm } from "@/features/keys/components/KeysForm"
import { KeysList } from "@/features/keys/components/KeysPage"
import { db } from "@/lib/database"
import { headers } from "next/headers"

export default async function KeysPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  const keys = await db.query.apiKeys.findMany({
    where: { userId: session!.user.id },
    columns: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
    orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
  })

  return (
    <div className=" mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">API keys</h1>
          <p className="text-sm text-muted-foreground">
            Used by your coding agent to call ShipSmall&apos;s MCP server.
          </p>
        </div>
        <KeysForm />
      </div>

      <KeysList keys={keys} />
    </div>
  )
}