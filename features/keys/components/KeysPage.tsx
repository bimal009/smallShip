"use client"

import { useDeleteKey, useKeys } from "@/features/keys/api/queries"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmAlert } from "@/components/confirm-alert"
import { TrashIcon } from "lucide-react"

export function KeysList() {
  const { data: keys = [], isPending, isError, error, refetch } = useKeys()
  const deleteKey = useDeleteKey()

  async function handleRevoke(keyId: string, name: string) {
    try {
      await deleteKey.mutateAsync(keyId)
      toast.success(`"${name}" revoked`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (isPending) {
    return (
      <div role="status" aria-label="Loading API keys">
        <div aria-hidden="true" className="rounded-md border divide-y">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="size-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-2">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button variant="outline" onClick={() => void refetch()}>Try again</Button>
      </div>
    )
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
                  ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                  : "Never used"}
            </span>

            {!key.revokedAt && (
              <ConfirmAlert
                trigger={
                  <Button size="icon" variant="ghost" className="size-8" disabled={deleteKey.isPending} aria-label={`Revoke ${key.name}`}>
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
