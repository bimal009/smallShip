"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmAlert } from "@/components/confirm-alert"
import { TrashIcon } from "lucide-react"

type ApiKeyRow = {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: Date | null
  createdAt: Date
  revokedAt: Date | null
}

export function KeysList({ keys }: { keys: ApiKeyRow[] }) {
  const router = useRouter()

  async function handleRevoke(keyId: string, name: string) {
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to revoke key")
      }

      toast.success(`"${name}" revoked`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (keys.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No API keys yet. Create one to connect your coding agent.
      </div>
    )
  }

  return (
    <div className="rounded-md border divide-y">
      {keys.map((key) => (
        <div
          key={key.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{key.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {key.keyPrefix}...
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {key.revokedAt
                ? "Revoked"
                : key.lastUsedAt
                  ? `Last used ${key.lastUsedAt.toLocaleDateString()}`
                  : "Never used"}
            </span>

            {!key.revokedAt && (
              <ConfirmAlert
                trigger={
                  <Button size="icon" variant="ghost" className="size-8">
                    <TrashIcon className="size-4" />
                  </Button>
                }
                title="Revoke this key?"
                description={`"${key.name}" will stop working immediately. Any agent using it will lose access.`}
                confirmLabel="Revoke"
                variant="destructive"
                onConfirm={() => handleRevoke(key.id, key.name)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}