"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckIcon, CopyIcon, PlusIcon } from "lucide-react"
import { type CreatedKey } from "@/features/keys/api/keys"
import { useCreateKey } from "@/features/keys/hooks/queries"

export function KeysForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const createKey = useCreateKey()
  const loading = createKey.isPending
  const [error, setError] = React.useState<string | null>(null)
  const [createdKey, setCreatedKey] = React.useState<CreatedKey | null>(null)
  const [copied, setCopied] = React.useState(false)

  async function handleCreate() {
    if (!name.trim() || loading) return
    setError(null)

    try {
      const key = await createKey.mutateAsync(name.trim())
      setCreatedKey(key)
      createKey.reset()
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  function handleCopy() {
    if (!createdKey) return
    navigator.clipboard.writeText(createdKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenChange(next: boolean) {
    if (loading && !next) return
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        setName("")
        setError(null)
        setCreatedKey(null)
        setCopied(false)
      }, 150)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <PlusIcon className="size-4" />
        New key
      </DialogTrigger>

      <DialogContent>
        {!createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Used to authenticate your coding agent with ShipSmall&apos;s
                MCP server.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="Claude Code on laptop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
              >
                {loading ? "Creating..." : "Create key"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{createdKey.name}</DialogTitle>
              <DialogDescription>
                Copy this key now. You won&apos;t be able to see it again.
              </DialogDescription>
            </DialogHeader>

       <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 overflow-hidden">
  <code className="flex-1 min-w-0 truncate font-mono text-sm">
    {createdKey.key}
  </code>
  <Button
    size="icon"
    variant="ghost"
    className="size-8 shrink-0"
    onClick={handleCopy}
  >
    {copied ? (
      <CheckIcon className="size-4" />
    ) : (
      <CopyIcon className="size-4" />
    )}
  </Button>
</div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
