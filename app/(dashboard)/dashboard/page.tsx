"use client";

import * as React from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Globe,
  HardDrive,
  KeyRound,
  LayoutGrid,
  Menu,
  Mic,
  MoreVertical,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  Terminal,
  TrendingUp,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                  Tokens                                    */
/* -------------------------------------------------------------------------- */

const CARD =
  "gap-0 py-0 rounded-3xl border border-border/60 bg-card shadow-sm";

/* -------------------------------------------------------------------------- */
/*                                Dummy data                                  */
/* -------------------------------------------------------------------------- */

type AppStatus = "running" | "deploying" | "sleeping" | "failed";

const apps: {
  id: string;
  name: string;
  subdomain: string;
  status: AppStatus;
  cpu: number;
  memory: number;
  uptime: string;
  lastDeploy: string;
}[] = [
  {
    id: "app_8f2a",
    name: "invoice-pilot",
    subdomain: "invoice-pilot.shipsmall.app",
    status: "running",
    cpu: 12,
    memory: 148,
    uptime: "4d 12h",
    lastDeploy: "2h ago",
  },
  {
    id: "app_3c91",
    name: "team-notes",
    subdomain: "team-notes.shipsmall.app",
    status: "running",
    cpu: 4,
    memory: 92,
    uptime: "1d 3h",
    lastDeploy: "8h ago",
  },
  {
    id: "app_7b44",
    name: "crm-lite",
    subdomain: "crm-lite.shipsmall.app",
    status: "deploying",
    cpu: 38,
    memory: 210,
    uptime: "—",
    lastDeploy: "just now",
  },
  {
    id: "app_1a09",
    name: "time-tracker",
    subdomain: "time-tracker.shipsmall.app",
    status: "sleeping",
    cpu: 0,
    memory: 0,
    uptime: "—",
    lastDeploy: "3d ago",
  },
  {
    id: "app_5e77",
    name: "feedback-box",
    subdomain: "feedback-box.shipsmall.app",
    status: "failed",
    cpu: 0,
    memory: 0,
    uptime: "—",
    lastDeploy: "1d ago",
  },
];

const logs: {
  t: string;
  level: "info" | "success" | "warn" | "error";
  app: string;
  msg: string;
}[] = [
  { t: "12:04:18", level: "info", app: "invoice-pilot", msg: "GET /dashboard 200 in 42ms" },
  { t: "12:04:11", level: "info", app: "invoice-pilot", msg: "POST /api/invoices 201 in 118ms" },
  { t: "12:04:02", level: "success", app: "crm-lite", msg: "build completed in 18.4s — image pushed" },
  { t: "12:03:57", level: "warn", app: "crm-lite", msg: "health check timed out, restarting container" },
  { t: "12:03:44", level: "info", app: "team-notes", msg: "GET /notes 200 in 31ms" },
  { t: "12:03:29", level: "error", app: "feedback-box", msg: "uncaught exception: ECONNREFUSED 127.0.0.1:5432" },
  { t: "12:03:12", level: "info", app: "time-tracker", msg: "container idle for 15m — entering sleep mode" },
  { t: "12:02:58", level: "success", app: "invoice-pilot", msg: "sqlite checkpoint complete, snapshot → S3" },
  { t: "12:02:41", level: "info", app: "crm-lite", msg: "pulling base image node:20-alpine" },
  { t: "12:02:20", level: "info", app: "team-notes", msg: "GET /api/session 200 in 22ms" },
];

const activity = [8, 14, 10, 18, 12, 22, 16, 26, 20, 30, 24, 34, 28, 20];

const traffic = [
  12, 18, 15, 22, 19, 28, 24, 31, 27, 35, 30, 38, 33, 42, 37, 45, 40, 48, 44,
  52, 47, 56, 51, 60,
];

const quickActions = [
  { icon: Globe, label: "Connect repo" },
  { icon: KeyRound, label: "Manage secrets" },
  { icon: Globe, label: "Add domain" },
  { icon: Database, label: "Restore backup" },
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const statusStyles: Record<
  AppStatus,
  { label: string; dot: string; badge: string }
> = {
  running: {
    label: "Running",
    dot: "bg-primary",
    badge: "border-transparent bg-primary/10 text-primary",
  },
  deploying: {
    label: "Deploying",
    dot: "bg-primary/60 animate-pulse",
    badge: "border-transparent bg-primary/10 text-primary",
  },
  sleeping: {
    label: "Sleeping",
    dot: "bg-muted-foreground/50",
    badge: "border-transparent bg-muted text-muted-foreground",
  },
  failed: {
    label: "Failed",
    dot: "bg-destructive",
    badge: "border-transparent bg-destructive/10 text-destructive",
  },
};

function StatusBadge({ status }: { status: AppStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
        s.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
      {children}
      <ChevronDown className="size-3" />
    </button>
  );
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const id = React.useId();
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 100;
  const H = 32;
  const step = W / (data.length - 1);
  const pts = data.map(
    (v, i) => [i * step, H - ((v - min) / range) * (H - 4) - 2] as const,
  );
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("text-primary", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HealthRing({ value, size = 132 }: { value: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-muted"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-primary"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-semibold leading-none">{value}%</div>
        <div className="mt-1 text-[10px] text-muted-foreground">health</div>
      </div>
    </div>
  );
}

const levelColor: Record<string, string> = {
  info: "text-muted-foreground",
  success: "text-primary",
  warn: "text-foreground",
  error: "text-destructive",
};

/* -------------------------------------------------------------------------- */
/*                                 Dashboard                                  */
/* -------------------------------------------------------------------------- */

export function DeployDashboard() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
        {/* ------------------------------- Top bar ------------------------------ */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card px-3 py-2 shadow-sm">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
            >
              <Menu className="size-4" />
            </Button>
            <div className="grid size-10 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              SM
            </div>
            <div className="pr-2">
              <div className="text-sm font-semibold leading-tight">
                ShipSmall
              </div>
              <div className="text-[11px] leading-tight text-muted-foreground">
                Deploy Console
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full bg-card"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full bg-card"
            >
              <Bell className="size-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card py-1.5 pl-1.5 pr-3 shadow-sm">
              <Avatar className="size-8">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces"
                  alt="Dwayne Tatum"
                />
                <AvatarFallback>DT</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xs font-medium leading-tight">
                  Dwayne Tatum
                </div>
                <div className="text-[10px] leading-tight text-muted-foreground">
                  Founder
                </div>
              </div>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Start searching here…"
                className="w-64 rounded-full bg-card pl-9"
              />
            </div>
          </div>
        </header>

        {/* ------------------------------ Body layout --------------------------- */}
        <div className="mt-6 flex gap-5">
          {/* Left rail */}
          <aside className="hidden w-12 shrink-0 flex-col gap-3 md:flex">
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full bg-card"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full bg-card"
            >
              <Share2 className="size-4" />
            </Button>
          </aside>

          <main className="min-w-0 flex-1 space-y-5">
            {/* ------------------------------ Hero row ---------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-20 place-items-center rounded-full border border-border/60 bg-card shadow-sm">
                  <div className="text-center">
                    <div className="text-2xl font-semibold leading-none">
                      19
                    </div>
                    <div className="mt-1 text-[10px] leading-none text-muted-foreground">
                      Tue, Dec
                    </div>
                  </div>
                </div>
                <Button className="h-12 rounded-full px-5 text-sm">
                  Deploy new app
                  <ArrowRight className="ml-1 size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative size-12 rounded-full bg-card"
                >
                  <Calendar className="size-5" />
                  <span className="absolute right-3 top-3 size-1.5 rounded-full bg-primary" />
                </Button>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Hey, Need help? <span className="inline-block">👋</span>
                  </h1>
                  <p className="text-2xl font-light text-muted-foreground md:text-3xl">
                    Just ask me anything!
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="hidden size-16 rounded-full bg-card sm:inline-flex"
                >
                  <Mic className="size-5" />
                </Button>
              </div>
            </div>

            {/* ------------------------------ Stat row ---------------------------- */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Instance card */}
              <Card className={CARD}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="size-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        EC2 · us-east-1
                      </span>
                    </div>
                    <Pill>Direct</Pill>
                  </div>

                  <div className="mt-5">
                    <div className="text-[11px] text-muted-foreground">
                      Instance ID
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-wider">
                      i-0a****2719
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button className="rounded-full">
                      <Terminal className="size-4" />
                      Logs
                    </Button>
                    <Button variant="outline" className="rounded-full">
                      <ExternalLink className="size-4" />
                      SSH
                    </Button>
                  </div>

                  <Separator className="my-5" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        Monthly cost
                      </div>
                      <div className="mt-0.5 text-sm font-semibold">
                        $25.00
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        Runtime
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                        <ShieldCheck className="size-3.5 text-primary" />
                        gVisor
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total deploys */}
              <Card className={CARD}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket className="size-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Total deploys
                      </span>
                    </div>
                    <Pill>Weekly</Pill>
                  </div>
                  <div className="mt-8 text-3xl font-semibold tracking-tight">
                    128
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                    <TrendingUp className="size-3" />
                    +14% vs last week
                  </div>
                </CardContent>
              </Card>

              {/* Requests served */}
              <Card className={CARD}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Requests served
                      </span>
                    </div>
                    <Pill>Weekly</Pill>
                  </div>
                  <div className="mt-8 text-3xl font-semibold tracking-tight">
                    1.24M
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                    <TrendingUp className="size-3" />
                    +9.3% vs last week
                  </div>
                </CardContent>
              </Card>

              {/* Uptime */}
              <Card className={CARD}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Instance uptime
                    </span>
                  </div>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-tight">
                      13
                    </span>
                    <span className="text-sm text-muted-foreground">Days</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    109 hours, 23 minutes
                  </div>
                  <div className="mt-5 grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "size-2 rounded-full",
                          i < 22 ? "bg-primary" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ------------------------ Running apps + sidebar -------------------- */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Running apps */}
              <Card className={cn(CARD, "lg:col-span-8")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Running apps
                    </CardTitle>
                    <Badge className="rounded-full bg-primary text-[10px] text-primary-foreground">
                      {apps.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative hidden sm:block">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search apps…"
                        className="h-8 w-44 rounded-full pl-8 text-xs"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-accent"
                      >
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                          <Globe className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {app.name}
                            </span>
                            <StatusBadge status={app.status} />
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {app.subdomain}
                          </div>
                        </div>

                        <div className="hidden items-center gap-6 text-xs md:flex">
                          <div className="w-14">
                            <div className="text-muted-foreground">CPU</div>
                            <div className="font-medium">{app.cpu}%</div>
                          </div>
                          <div className="w-16">
                            <div className="text-muted-foreground">Mem</div>
                            <div className="font-medium">{app.memory} MB</div>
                          </div>
                          <div className="w-16">
                            <div className="text-muted-foreground">Uptime</div>
                            <div className="font-medium">{app.uptime}</div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                        >
                          <Terminal className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right stack */}
              <div className="flex flex-col gap-5 lg:col-span-4">
                {/* Sandbox health */}
                <Card className={CARD}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Sandbox</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full text-[10px]"
                      >
                        gVisor
                      </Badge>
                    </div>

                    <div className="my-4 flex justify-center">
                      <HealthRing value={92} />
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        Runtime health
                      </div>
                      <div className="mt-0.5 text-sm font-medium">
                        All containers isolated
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick actions */}
                <Card className={CARD}>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-base font-semibold">
                      Quick actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border">
                          <action.icon className="size-3.5 text-muted-foreground" />
                        </span>
                        <span className="text-sm font-medium">
                          {action.label}
                        </span>
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ----------------------- Activity + live logs ----------------------- */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Activity */}
              <Card className={cn(CARD, "lg:col-span-5")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Activity manager
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      Team
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      Insights
                    </Badge>
                    <Badge className="rounded-full bg-primary text-[10px] text-primary-foreground">
                      Today
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight">
                      24
                    </span>
                    <span className="text-sm text-muted-foreground">
                      deploys today
                    </span>
                  </div>

                  <div className="mt-6 flex h-28 items-end gap-1.5">
                    {activity.map((v, i) => (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center"
                      >
                        <div
                          className={cn(
                            "w-1.5 rounded-full",
                            i === activity.length - 2
                              ? "bg-primary"
                              : "bg-primary/25",
                          )}
                          style={{ height: `${(v / 36) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Succeeded
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary/30" />
                      Other
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Live logs */}
              <Card className={cn(CARD, "lg:col-span-7")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Live logs
                    </CardTitle>
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full text-xs"
                  >
                    <RefreshCw className="size-3" />
                    Pause
                  </Button>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-2xl bg-muted/50 p-4 font-mono text-xs">
                    {logs.map((l, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="shrink-0 text-muted-foreground/70">
                          {l.t}
                        </span>
                        <span
                          className={cn(
                            "w-14 shrink-0 font-medium",
                            levelColor[l.level],
                          )}
                        >
                          {l.level.toUpperCase()}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          [{l.app}]
                        </span>
                        <span className="text-foreground">{l.msg}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ----------------------- Storage + traffic -------------------------- */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Storage circles */}
              <Card className={cn(CARD, "lg:col-span-4")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Storage & backups
                  </CardTitle>
                  <Pill>2026</Pill>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="relative mx-auto size-52">
                    <div className="absolute inset-0 rounded-full bg-primary/5" />
                    <div className="absolute inset-[16%] rounded-full bg-primary/10" />
                    <div className="absolute inset-[32%] rounded-full bg-primary/20" />
                    <div className="absolute inset-[48%] grid place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      4 GB
                    </div>
                    <span className="absolute right-[2%] top-[20%] text-xs font-semibold text-primary">
                      14 GB
                    </span>
                    <span className="absolute right-[18%] top-[38%] text-xs font-semibold text-primary">
                      9.3 GB
                    </span>
                    <span className="absolute right-[32%] top-[56%] text-xs font-semibold text-primary">
                      6.8 GB
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        Apps
                      </div>
                      <div className="text-sm font-semibold">4.0 GB</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        Backups
                      </div>
                      <div className="text-sm font-semibold">6.8 GB</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">
                        Logs
                      </div>
                      <div className="text-sm font-semibold">1.2 GB</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Traffic */}
              <Card className={cn(CARD, "lg:col-span-8")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      Request volume
                    </CardTitle>
                  </div>
                  <Badge className="rounded-full bg-primary/10 text-[10px] text-primary">
                    +9.3%
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 pt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight">
                      1,240,073
                    </span>
                    <span className="text-xs text-muted-foreground">
                      requests this week
                    </span>
                  </div>
                  <div className="mt-5 h-32">
                    <Sparkline data={traffic} className="size-full" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DeployDashboard;