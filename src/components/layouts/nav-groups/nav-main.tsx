"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="py-2">
      <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              isActive={pathname === item.url}
              className={`
                transition-all duration-200 rounded-lg py-1.5 h-8.5 group relative
                ${pathname === item.url 
                  ? 'bg-teal-50/60 text-[#0D5C63] font-semibold border-l-2 border-[#0D5C63] rounded-l-none' 
                  : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-950'
                }
              `}
            >
              <Link href={item.url} className="flex items-center gap-2.5 px-2">
                {item.icon && (
                  <item.icon className={`w-4 h-4 transition-colors duration-200 ${
                    pathname === item.url 
                      ? 'text-[#0D5C63]' 
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                )}
                <span className="text-xs">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
