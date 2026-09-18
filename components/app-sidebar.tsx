"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  AppWindowIcon,
  RocketIcon,
  GaugeIcon,
  KeyRoundIcon,
  ScrollTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  GlobeIcon,
  BookOpenIcon,
  PackageIcon,
  PlusIcon,
} from "lucide-react"

const navMain = [
  { title: "Overview", url: "/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "Apps", url: "/dashboard/apps", icon: <AppWindowIcon /> },
  { title: "Deployments", url: "/dashboard/deployments", icon: <RocketIcon /> },
]

const configuration = [
  { name: "Secrets", url: "/dashboard/secrets", icon: <KeyRoundIcon /> },
  { name: "Domains", url: "/dashboard/domains", icon: <GlobeIcon /> },
]

const monitoring = [
  { title: "Usage & Billing", url: "/dashboard/usage", icon: <GaugeIcon /> },
  { title: "Logs", url: "/dashboard/logs", icon: <ScrollTextIcon /> },
]

const navSecondary = [
  { title: "Docs", url: "/dashboard/docs", icon: <BookOpenIcon /> },
  { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
  { title: "Get Help", url: "/help", icon: <CircleHelpIcon /> },
  { title: "Search", url: "/search", icon: <SearchIcon /> },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const sidebarUser = user ?? { name: "User", email: "", avatar: undefined }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="gap-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <PackageIcon className="size-5!" />
              <span className="text-base font-semibold">ShipSmall</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Button
          size="sm"
          className="w-full justify-start gap-2"
          render={<a href="/dashboard/apps/new" />}
        >
          <PlusIcon className="size-4" />
          New app
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={configuration} label="Configuration" />
        <NavMain items={monitoring} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}