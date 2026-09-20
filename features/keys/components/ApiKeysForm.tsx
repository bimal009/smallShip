"use client"

import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCreateKey } from "../hooks/queries"
import type { CreatedKey } from "../api/keys"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

export function ApiKeysForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [created, setCreated] = useState<CreatedKey | null>(null)
  const createKey = useCreateKey()
  const nameId = useId()

  function handleOpenChange(next: boolean) {
    if (createKey.isPending) return
    setOpen(next)
    if (!next) {
      setName("")
      setCreated(null)
      createKey.reset()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || createKey.isPending) return
    try {
      setCreated(await createKey.mutateAsync(name.trim()))
      createKey.reset()
    } catch {
      // The mutation exposes the error below the input.
    }
  }

  async function copyKey() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.key)
      toast.success("API key copied")
    } catch {
      toast.error("Could not copy. Select and copy the key manually.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>New API key</DialogTrigger>
      <DialogContent showCloseButton={!createKey.isPending}>
        <DialogHeader>
          <DialogTitle>{created ? created.name : "Create API key"}</DialogTitle>
          <DialogDescription>
            {created ? "Copy this key now. You won't be able to see it again." : "Authenticate your coding agent with ShipSmall's MCP server."}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <>
            <code className="select-all break-all rounded-md bg-muted p-3 text-xs">{created.key}</code>
            <DialogFooter>
              <Button variant="outline" onClick={() => void copyKey()}>Copy key</Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Name</Label>
              <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)}
                placeholder="Coding agent on laptop" required disabled={createKey.isPending} />
              {createKey.error && <p role="alert" className="text-sm text-destructive">{createKey.error.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!name.trim() || createKey.isPending}>
                {createKey.isPending ? "Creating..." : "Create key"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
