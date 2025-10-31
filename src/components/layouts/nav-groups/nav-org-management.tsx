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
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Organization Management</SidebarGroupLabel>
      <SidebarMenu className="space-y-2">
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
                    transition-all duration-300 rounded-xl mx-1 group relative overflow-hidden
                    ${pathname === item.url 
                      ? 'bg-white/90 backdrop-blur-xl border border-white/20 text-[#0D5C63] font-semibold' 
                      : 'hover:bg-white/50 hover:backdrop-blur-lg hover:border hover:border-white/30'
                    }
                  `}
                >
                  <Link href={item.url} className="flex items-center gap-3 relative z-10">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                      pathname === item.url 
                        ? 'bg-gradient-to-br from-[#0D5C63] to-[#0a4a50] text-white' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 text-[#0D5C63] group-hover:from-[#0D5C63]/10 group-hover:to-[#0D5C63]/20 group-hover:scale-110'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {pathname === item.url && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -z-10" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
