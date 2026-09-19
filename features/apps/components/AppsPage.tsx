"use client"

import {
  Clock,
  GitBranch,
  FolderGit2,
  Globe,
  Rocket,
  CircleAlert,
} from "lucide-react"

import { useApps } from "@/features/apps/hooks/use-apps"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type AppItem = NonNullable<ReturnType<typeof useApps>["data"]>[number]

const STATUS_STYLES: Record<string, string> = {
  running: "border-chart-2/25 bg-chart-2/10 text-chart-2",
  failed: "border-destructive/25 bg-destructive/10 text-destructive",
}
const STATUS_FALLBACK = "border-border bg-muted text-muted-foreground"

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

function MetaRow({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <dt className="sr-only">{label}</dt>
      <span aria-hidden="true" className="shrink-0 text-muted-foreground">
        {icon}
      </span>
      <dd className="min-w-0 flex-1 truncate font-mono text-[13px]">{children}</dd>
    </div>
  )
}

function AppCard({ app }: { app: AppItem }) {
  const deployedAt = app.lastDeployedAt ? new Date(app.lastDeployedAt) : null

  return (
    <Card className="gap-0 overflow-hidden rounded-lg border-border bg-card py-0 shadow-xs">
      <div className="space-y-1 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 truncate text-base font-semibold tracking-tight">
            {app.name}
          </h2>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1.5 capitalize",
              STATUS_STYLES[app.status] ?? STATUS_FALLBACK,
            )}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {app.status}
          </Badge>
        </div>
        <p className="truncate font-mono text-xs text-muted-foreground">{app.slug}</p>
      </div>

      <dl className="space-y-2.5 px-5 pb-5">
        <MetaRow label="Repository" icon={<FolderGit2 size={16} />}>
          <a
            href={`https://github.com/${app.githubRepoFullName}`}
            target="_blank"
            rel="noreferrer noopener"
            title={app.githubRepoFullName}
            className="underline-offset-4 hover:underline focus-visible:underline"
          >
            {app.githubRepoFullName}
          </a>
        </MetaRow>

        <MetaRow label="Branch" icon={<GitBranch size={16} />}>
          <span title={app.githubBranch}>{app.githubBranch}</span>
        </MetaRow>

        {app.customDomain && (
          <MetaRow label="Domain" icon={<Globe size={16} />}>
            <a
              href={`https://${app.customDomain}`}
              target="_blank"
              rel="noreferrer noopener"
              title={app.customDomain}
              className="underline-offset-4 hover:underline focus-visible:underline"
            >
              {app.customDomain}
            </a>
          </MetaRow>
        )}
      </dl>

      <div className="mt-auto flex items-center gap-2 border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
        <Clock size={14} aria-hidden="true" />
        {deployedAt ? (
          <span>
            Deployed{" "}
            <time
              dateTime={deployedAt.toISOString()}
              title={deployedAt.toLocaleString()}
              className="text-foreground"
            >
              {formatRelative(deployedAt)}
            </time>
          </span>
        ) : (
          <span>Not deployed yet</span>
        )}
      </div>
    </Card>
  )
}

function AppCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-xs">
      <div className="space-y-2 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="space-y-3 px-5 pb-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="border-t bg-muted/40 px-5 py-3">
        <Skeleton className="h-3.5 w-28" />
      </div>
    </Card>
  )
}

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"

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
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      >
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
