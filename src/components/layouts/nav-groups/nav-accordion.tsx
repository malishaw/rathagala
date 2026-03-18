"use client";

import { type LucideIcon, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavAccordion({
  label,
  icon: GroupIcon,
  items,
}: {
  label: string;
  icon: LucideIcon;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  const isAnyActive = items.some((item) => pathname === item.url);
  const [open, setOpen] = useState(isAnyActive);

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-1 cursor-pointer select-none flex items-center justify-between hover:text-slate-800 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <GroupIcon className="w-3.5 h-3.5" />
          {label}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </SidebarGroupLabel>

      {open && (
        <SidebarMenu className="space-y-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname === item.url}
                className={cn(
                  "transition-all duration-300 rounded-xl mx-1 group relative overflow-hidden",
                  pathname === item.url
                    ? "bg-white/90 backdrop-blur-xl border border-white/20 text-[#0D5C63] font-semibold"
                    : "hover:bg-white/50 hover:backdrop-blur-lg hover:border hover:border-white/30"
                )}
              >
                <Link href={item.url} className="flex items-center gap-3 relative z-10">
                  {item.icon && (
                    <div
                      className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        pathname === item.url
                          ? "bg-gradient-to-br from-[#0D5C63] to-[#0a4a50] text-white"
                          : "bg-gradient-to-br from-slate-100 to-slate-200 text-[#0D5C63] group-hover:from-[#0D5C63]/10 group-hover:to-[#0D5C63]/20 group-hover:scale-110"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-medium">{item.title}</span>
                  {pathname === item.url && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -z-10" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}
