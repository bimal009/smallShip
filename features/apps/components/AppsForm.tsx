"use client"

import { useId } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { appsUpdateSchema } from "@/lib/database/schema/apps"
import {   AppRecord, type UpdateAppInput } from "../api/apps"
import { useUpdateApp } from "../hooks/use-apps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function AppsForm({
  app,
  onOpenChange,
}: {
  app: AppRecord
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
    <Sheet open onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open) }}>
      <SheetContent showCloseButton={!isSubmitting}>
        <SheetHeader>
          <SheetTitle>Edit app</SheetTitle>
          <SheetDescription>Update the name of your app.</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-2 overflow-y-auto px-4">
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
          <SheetFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
