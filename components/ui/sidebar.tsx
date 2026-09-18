"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  href?: string;
  badge?: number | string;
  shortcut?: string;
  disabled?: boolean;
  children?: NavItemData[];
};
export type NavGroupData = { heading?: string; items: NavItemData[] };

function WorkspaceSwitcher({ selected, workspaces, onSelect }: { selected: string; workspaces: string[]; onSelect?: (workspace: string) => void }) {
  return <DropdownMenu>
    <DropdownMenuTrigger className="mb-4 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-ring dark:hover:bg-white/5">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm">{selected.charAt(0)}</span>
        <span className="flex min-w-0 flex-col"><span className="mb-1 truncate text-[13px] font-medium leading-none">{selected}</span><span className="text-[11px] leading-none text-muted-foreground">Workspace</span></span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {workspaces.map((workspace) => <DropdownMenuItem key={workspace} onClick={() => onSelect?.(workspace)} className={cn("px-3 py-2 text-[13px]", selected === workspace && "bg-primary/10 font-medium text-primary")}>{workspace}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

function containsActive(item: NavItemData, activeId: string): boolean {
  return item.id === activeId || !!item.children?.some((child) => containsActive(child, activeId));
}
function NavItem({ item, activeId, onSelect, level = 0 }: { item: NavItemData; activeId: string; onSelect: (id: string) => void; level?: number }) {
  const active = item.id === activeId;
  const hasChildren = !!item.children?.length;
  const [expanded, setExpanded] = useState(containsActive(item, activeId));
  const contentId = useId();
  const className = cn("group flex w-full items-center justify-between rounded-[6px] px-2.5 py-[7px] text-left transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", active ? "bg-black/5 font-medium text-foreground dark:bg-white/10" : "text-muted-foreground hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5");
  const content = <>
    <span className="flex min-w-0 items-center gap-2.5"><item.icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground/70")} strokeWidth={1.5} /><span className="truncate text-[13px] tracking-wide">{item.title}</span></span>
    <span className="flex items-center gap-2">
      {item.shortcut && <kbd className="hidden h-5 items-center rounded border border-border/50 bg-background/50 px-1.5 font-mono text-[10px] text-muted-foreground/60 group-hover:inline-flex group-focus-visible:inline-flex">{item.shortcut}</kbd>}
      {item.badge != null && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">{item.badge}</span>}
      {hasChildren && <ChevronRight className={cn("size-3.5 text-muted-foreground/50 transition-transform motion-reduce:transition-none", expanded && "rotate-90")} />}
    </span>
  </>;
  return <div className="flex w-full flex-col">
    {item.href && !hasChildren ? <Link href={item.href} className={className} style={{ paddingLeft: level * 12 + 10 }} aria-current={active ? "page" : undefined} onClick={() => onSelect(item.id)}>{content}</Link> :
      <button type="button" className={className} style={{ paddingLeft: level * 12 + 10 }} disabled={item.disabled} aria-expanded={hasChildren ? expanded : undefined} aria-controls={hasChildren ? contentId : undefined} onClick={() => hasChildren ? setExpanded(!expanded) : onSelect(item.id)}>{content}</button>}
    {hasChildren && <div id={contentId} inert={!expanded} className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none", expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
      <div className="relative flex min-h-0 flex-col gap-0.5 overflow-hidden"><div className="absolute inset-y-0 border-l border-border/50" style={{ left: level * 12 + 17.5 }} />
        {item.children!.map((child) => <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />)}
      </div>
    </div>}
  </div>;
}

export function SidebarNav({ className, groups, bottomItems, activeId = "home", onSelect, activeWorkspace = "ShipSmall", workspaces = ["ShipSmall"], onWorkspaceSelect, footer }: {
  className?: string;
  groups: NavGroupData[];
  bottomItems: NavItemData[];
  activeId?: string;
  onSelect: (id: string) => void;
  activeWorkspace?: string;
  workspaces?: string[];
  onWorkspaceSelect?: (workspace: string) => void;
  footer?: React.ReactNode;
}) {
  return <div className={cn("flex h-full w-[260px] flex-col border-r border-border/50 bg-card/50 p-3 font-sans", className)}>
    <WorkspaceSwitcher selected={activeWorkspace} workspaces={workspaces} onSelect={onWorkspaceSelect} />
    <nav aria-label="Main navigation" className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto [scrollbar-width:none]">
      {groups.map((group, index) => <div key={group.heading ?? index} className="flex flex-col gap-0.5">
        {group.heading && <span className="mb-1 px-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">{group.heading}</span>}
        {group.items.map((item) => <NavItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />)}
      </div>)}
    </nav>
    <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-4">{bottomItems.map((item) => <NavItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />)}{footer}</div>
  </div>;
}
