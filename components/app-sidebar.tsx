"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  RocketIcon as CommandIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Bimal Pandey",
    email: "bimal@shipsmall.ai",
    avatar: "/avatars/bimal.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Apps",
      url: "/dashboard/apps",
      icon: <AppWindowIcon />,
    },
    {
      title: "Deployments",
      url: "/dashboard/deployments",
      icon: <RocketIcon />,
    },
    {
      title: "Usage & Billing",
      url: "/dashboard/usage",
      icon: <GaugeIcon />,
    },
    {
      title: "Logs",
      url: "/dashboard/logs",
      icon: <ScrollTextIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "/search",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Secrets",
      url: "/dashboard/secrets",
      icon: <KeyRoundIcon />,
    },
    {
      name: "Domains",
      url: "/dashboard/domains",
      icon: <GlobeIcon />,
    },
    {
      name: "Docs",
      url: "/dashboard/docs",
      icon: <BookOpenIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">ShipSmall</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}