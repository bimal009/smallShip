"use client"

import { useId } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

import type { AppOutput } from "@/lib/database/schema/apps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

type KeysInput = { keys: { key: string; value: string }[] }

export function KeysForm({ app, onOpenChange }: { app: AppOutput; onOpenChange: (open: boolean) => void }) {
  const form = useForm<KeysInput>({
    defaultValues: { keys: [{ key: "", value: "" }] },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "keys" })
  const { errors } = form.formState
  const id = useId()

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      form.reset()
    }
  }

  function handleSubmit(data: KeysInput) {
    const seen = new Set<string>()
    let duplicate = false
    data.keys.forEach(({ key }, index) => {
      if (seen.has(key)) {
        form.setError(`keys.${index}.key`, { message: "Each key must be unique" })
        duplicate = true
      }
      seen.add(key)
    })
    if (duplicate) return
    console.log("Added environment variables", { appId: app.id, keys: data.keys })
    handleOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add environment keys</DialogTitle>
          <DialogDescription className="break-words">Add keys and values for {app.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
          <div className="max-h-[55dvh] space-y-4 overflow-y-auto p-1">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${id}-${field.id}-key`}>Key</Label>
                    <Input id={`${id}-${field.id}-key`} placeholder="API_KEY"
                      {...form.register(`keys.${index}.key`, {
                        setValueAs: (value: string) => value.trim(),
                        required: "Key is required",
                        pattern: { value: /^[A-Za-z_][A-Za-z0-9_]*$/, message: "Use letters, numbers, and underscores; start with a letter or underscore." },
                      })}
                      aria-invalid={!!errors.keys?.[index]?.key}
                      aria-describedby={errors.keys?.[index]?.key ? `${id}-${field.id}-key-error` : undefined}
                      autoComplete="off" spellCheck={false} />
                    {errors.keys?.[index]?.key && <p id={`${id}-${field.id}-key-error`} role="alert" className="text-xs text-destructive">{errors.keys[index]?.key?.message}</p>}
                  </div>
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${id}-${field.id}-value`}>Value</Label>
                    <Input id={`${id}-${field.id}-value`} placeholder="Enter value"
                      {...form.register(`keys.${index}.value`, { required: "Value is required" })}
                      aria-invalid={!!errors.keys?.[index]?.value}
                      aria-describedby={errors.keys?.[index]?.value ? `${id}-${field.id}-value-error` : undefined}
                      autoComplete="off" spellCheck={false} />
                    {errors.keys?.[index]?.value && <p id={`${id}-${field.id}-value-error`} role="alert" className="text-xs text-destructive">{errors.keys[index]?.value?.message}</p>}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="mt-6 shrink-0"
                  disabled={fields.length === 1} aria-label={`Remove key ${index + 1}`}
                  onClick={() => { remove(index); form.clearErrors("keys") }}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => append({ key: "", value: "" })}>
            <Plus className="size-4" /> Add row
          </Button>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add {fields.length === 1 ? "key" : `${fields.length} keys`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
