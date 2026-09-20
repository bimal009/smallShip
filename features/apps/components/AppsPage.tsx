"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Clock,
  GitBranch,
  FolderGit2,
  Globe,
  Rocket,
  CircleAlert,
  MoreHorizontal,
  Trash2,
  Pencil,
  KeyRound,
} from "lucide-react"

import { useApps, useDeleteApp } from "@/features/apps/hooks/use-apps"
import { ConfirmAlert } from "@/components/confirm-alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { AppsForm } from "./AppsForm"
import { KeysForm } from "@/features/keys/components/KeysForm"
import type { AppOutput } from "@/lib/database/schema/apps"

const STATUS_CONFIG: Record<string, { dot: string; text: string; label?: string; pulse?: boolean }> = {
  running: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  creating: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", pulse: true },
  building: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", pulse: true },
  failed: { dot: "bg-destructive", text: "text-destructive" },
}
const STATUS_FALLBACK = { dot: "bg-muted-foreground", text: "text-muted-foreground" }
const CARD =
  "group gap-0 overflow-hidden rounded-3xl border border-border/60 bg-card py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md"

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
]

function formatRelative(date: Date) {
  const diff = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return "just now"
}

function StatusIndicator({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_FALLBACK
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium capitalize">
      <span className="relative flex size-1.5">
        {"pulse" in config && config.pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", config.dot)} />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full", config.dot)} />
      </span>
      <span className={config.text}>{status}</span>
    </div>
  )
}

function AppCard({ app }: { app: AppOutput }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const deleteApp = useDeleteApp()
  const deployedAt = app.lastDeployedAt ? new Date(app.lastDeployedAt) : null

  async function handleDelete() {
    try {
      await deleteApp.mutateAsync(app.id)
      toast.success(`"${app.name}" deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete app")
    }
  }

  return (
    <Card className={CARD}>
      <div className="space-y-1 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
              <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 title={app.name} className="truncate text-sm font-semibold tracking-tight">
                {app.name}
              </h2>
              <p title={app.slug} className="mt-1 truncate text-xs text-muted-foreground">
                {app.slug}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusIndicator status={app.status} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-full"
                    aria-label={`Actions for ${app.name}`}
                    disabled={deleteApp.isPending}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setKeysOpen(true)}>
                  <KeyRound className="size-4" />
                  Keys
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="mx-5 mb-5 space-y-3 rounded-2xl bg-muted/50 p-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <FolderGit2 size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <a
              href={`https://github.com/${app.githubRepoFullName}`}
              target="_blank"
              rel="noreferrer noopener"
              title={app.githubRepoFullName}
              className="min-w-0 truncate font-mono text-xs underline-offset-4 hover:underline focus-visible:underline"
            >
              {app.githubRepoFullName}
            </a>
          </div>
          <span
            title={app.githubBranch}
            className="flex shrink-0 items-center gap-1 rounded-full bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            <GitBranch size={11} aria-hidden="true" />
            {app.githubBranch}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 border-t border-border/60 pt-3">
          <Globe size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          {app.customDomain ? (
            <a
              href={`https://${app.customDomain}`}
              target="_blank"
              rel="noreferrer noopener"
              title={app.customDomain}
              className="min-w-0 truncate font-mono text-xs font-medium underline-offset-4 hover:underline focus-visible:underline"
            >
              {app.customDomain}
            </a>
          ) : (
            <span className="truncate font-mono text-xs text-muted-foreground">No domain configured</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock size={13} aria-hidden="true" />
          {deployedAt ? (
            <time
              dateTime={deployedAt.toISOString()}
              title={deployedAt.toLocaleString()}
              className="text-foreground"
            >
              {formatRelative(deployedAt)}
            </time>
          ) : (
            "Not deployed yet"
          )}
        </span>
        <span>{app.lastActiveAt ? `Active ${formatRelative(new Date(app.lastActiveAt))}` : "No activity yet"}</span>
      </div>

      <ConfirmAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this app?"
        description={`"${app.name}" will be permanently removed from your apps. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
      {editOpen && <AppsForm app={app} onOpenChange={setEditOpen} />}
      {keysOpen && <KeysForm app={app} onOpenChange={setKeysOpen} />}
    </Card>
  )
}

function AppCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-3xl border border-border/60 bg-card py-0 shadow-sm">
      <div className="space-y-2 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="mx-5 mb-5 space-y-3 rounded-2xl bg-muted/50 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="border-t px-5 py-3">
        <Skeleton className="h-3.5 w-28" />
      </div>
    </Card>
  )
}

const GRID = "grid gap-5 md:grid-cols-2 2xl:grid-cols-3"

export function AppsList() {
  const { data: apps = [], isPending, isError, error, refetch } = useApps()

  if (isPending) {
    return (
      <div role="status" aria-label="Loading apps">
        <div aria-hidden="true" className={GRID}>
          {[0, 1, 2].map((i) => (
            <AppCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <CircleAlert size={20} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Could not load your apps</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
          <Rocket size={20} aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">No apps yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ask your coding agent to create one through the MCP server and it will show up here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={GRID}>
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
