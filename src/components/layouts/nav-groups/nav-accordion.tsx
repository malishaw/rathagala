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
    <SidebarGroup className="py-2">
      <SidebarGroupLabel
        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5 cursor-pointer select-none flex items-center justify-between hover:text-slate-700 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <GroupIcon className="w-3.5 h-3.5" />
          {label}
        </span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </SidebarGroupLabel>

      {open && (
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname === item.url}
                className={cn(
                  "transition-all duration-200 rounded-lg py-1.5 h-8.5 group relative",
                  pathname === item.url
                    ? "bg-teal-50/60 text-[#0D5C63] font-semibold border-l-2 border-[#0D5C63] rounded-l-none"
                    : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-950"
                )}
              >
                <Link href={item.url} className="flex items-center gap-2.5 px-2">
                  {item.icon && (
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors duration-200",
                      pathname === item.url
                        ? "text-[#0D5C63]"
                        : "text-slate-400 group-hover:text-slate-700"
                    )} />
                  )}
                  <span className="text-xs">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}
