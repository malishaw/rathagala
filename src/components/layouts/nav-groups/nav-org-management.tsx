"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";

export function NavOrgManagement({
  cmLinks,
  activeMemberRole
}: {
  cmLinks: {
    name: string;
    url: string;
    icon: LucideIcon;
    roles?: string[];
  }[];
  activeMemberRole: string;
}) {
  const pathname = usePathname();

  const [access, setAccess] = useState<"owner" | "admin" | string | null>(
    activeMemberRole
  );

  useEffect(() => {
    setAccess(activeMemberRole);
  }, [activeMemberRole]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-2">
      <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">Organization Management</SidebarGroupLabel>
      <SidebarMenu className="space-y-0.5">
        {cmLinks.map((item) => {
          const isPublic = !item?.roles;
          const hasAccess = item.roles?.includes(access ?? "");

          if (isPublic || hasAccess)
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
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
                    <item.icon className={`w-4 h-4 transition-colors duration-200 ${
                      pathname === item.url 
                        ? 'text-[#0D5C63]' 
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`} />
                    <span className="text-xs">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
