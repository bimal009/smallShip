"use client"

import { useId } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { appsUpdateSchema, type AppOutput } from "@/lib/database/schema/apps"
import type { UpdateAppInput } from "../api/apps"
import { useUpdateApp } from "../hooks/use-apps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AppsForm({
  app,
  onOpenChange,
}: {
  app: AppOutput
  onOpenChange: (open: boolean) => void
}) {
  const nameId = useId()
  const updateApp = useUpdateApp()
  const form = useForm<UpdateAppInput>({
    resolver: zodResolver(appsUpdateSchema),
    defaultValues: { name: app.name },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(input: UpdateAppInput) {
    try {
      await updateApp.mutateAsync({ appId: app.id, input })
      toast.success("App updated")
      onOpenChange(false)
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Failed to update app",
      })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open) }}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>Edit app</DialogTitle>
          <DialogDescription>Update the name of your app.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={nameId} className="text-sm font-medium">App name</label>
            <Input
              id={nameId}
              {...form.register("name")}
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${nameId}-error` : undefined}
            />
            {errors.name && (
              <p id={`${nameId}-error`} role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
            {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
