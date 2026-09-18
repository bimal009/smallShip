"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, AppWindow, BookOpen, CircleHelp, CreditCard, Globe, Hash, KeyRound, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Rocket, Search, Settings } from "lucide-react";
import { SidebarNav, type NavGroupData, type NavItemData } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const groups: NavGroupData[] = [
  { items: [
    { id: "search", title: "Search", icon: Search, shortcut: "Ctrl K" },
    { id: "home", title: "Home", icon: LayoutDashboard, href: "/dashboard" },
    { id: "deployments", title: "Deployments", icon: Rocket, href: "/dashboard/deployments" },
    { id: "logs", title: "Logs", icon: Activity, href: "/dashboard/logs" },
  ] },
  { heading: "Workspace", items: [
    { id: "apps", title: "Apps", icon: AppWindow, children: [{ id: "all-apps", title: "All apps", icon: Hash, href: "/dashboard/apps" }] },
    { id: "domains", title: "Domains", icon: Globe, href: "/dashboard/domains" },
    { id: "billing", title: "Usage & Billing", icon: CreditCard, href: "/dashboard/usage" },
  ] },
  { heading: "Developers", items: [
    { id: "keys", title: "Keys", icon: KeyRound, href: "/dashboard/keys" },
   
    { id: "docs", title: "Docs", icon: BookOpen, href: "/dashboard/docs" },
    { id: "help", title: "Get Help", icon: CircleHelp, href: "/help" },
  ] },
];
const bottomItems: NavItemData[] = [
  { id: "settings", title: "Settings", icon: Settings, href: "/settings" },
  { id: "logout", title: "Log out", icon: LogOut },
];
const flatten = (items: NavItemData[]): NavItemData[] => items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
const allItems = flatten([...groups.flatMap((group) => group.items), ...bottomItems]);
type User = { name: string; email: string; avatar?: string };

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const activeItem = allItems.filter((item) => item.href && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)))).sort((a, b) => b.href!.length - a.href!.length)[0];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileOpen(false);
        setSearchOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSelect(id: string) {
    setMobileOpen(false);
    if (id === "search") { setSearchOpen(true); return; }
    if (id !== "logout" || pending) return;
    setPending(true);
    setError(false);
    try {
      const result = await signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/sign-in");
      router.refresh();
    } catch { setError(true); setPending(false); }
  }
  const navigation = <SidebarNav key={pathname} className="border-none bg-transparent" groups={groups} bottomItems={bottomItems.map((item) => item.id === "logout" ? { ...item, title: pending ? "Logging out..." : item.title, disabled: pending } : item)} activeId={activeItem?.id} onSelect={handleSelect} footer={error && <p role="alert" className="px-2.5 py-2 text-xs text-destructive">Could not log out. Please try again.</p>} />;

  return <div className="flex min-h-svh bg-background">
    <aside aria-label="Sidebar" inert={!open} className={cn("sticky top-0 hidden h-svh shrink-0 overflow-hidden border-r border-border/50 bg-card/50 transition-[width,opacity] duration-300 motion-reduce:transition-none md:block", open ? "w-[260px] opacity-100" : "w-0 border-none opacity-0")}>{navigation}</aside>
    <div className="flex min-w-0 flex-1 flex-col bg-black/[0.02] dark:bg-white/[0.02]">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden text-muted-foreground md:inline-flex" aria-label={open ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <PanelLeftClose className="size-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="size-[18px]" strokeWidth={1.5} />}</Button>
          <Sheet open={mobileOpen && isMobile} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" />}><PanelLeftOpen className="size-[18px]" /></SheetTrigger>
            <SheetContent side="left" className="w-[260px]! gap-0 pt-10" aria-describedby={undefined}><SheetTitle className="sr-only">Navigation</SheetTitle>{navigation}</SheetContent>
          </Sheet>
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><span className="hidden sm:inline">ShipSmall</span><span className="hidden sm:inline">/</span><span className="truncate font-medium text-foreground">{activeItem?.title ?? "Dashboard"}</span></div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setSearchOpen(true)} aria-label="Search navigation"><Search className="size-4" /><span className="hidden sm:inline">Search...</span></Button>
          <Avatar className="size-8" title={user.email}><AvatarImage src={user.avatar} alt={user.name} /><AvatarFallback>{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</AvatarFallback></Avatar>
        </div>
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search navigation" description="Find a page or run an action." showCloseButton>
      <Command><CommandInput placeholder="Search pages or actions..." /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup heading="Pages and actions">
        {allItems.filter((item) => item.href || item.id === "logout").map((item) => <CommandItem key={item.id} value={item.title} disabled={item.id === "logout" && pending} onSelect={() => { setSearchOpen(false); if (item.href) router.push(item.href); else void handleSelect(item.id); }}><item.icon className="size-4" /><span>{item.title}</span></CommandItem>)}
      </CommandGroup></CommandList></Command>
    </CommandDialog>
  </div>;
}

