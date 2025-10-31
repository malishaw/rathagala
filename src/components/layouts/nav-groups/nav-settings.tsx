"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavSettings({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">System</SidebarGroupLabel>
      <SidebarMenu className="space-y-2">
        {items.map((item) =>
          item.items ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={pathname.includes("settings")}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className="transition-all duration-300 rounded-xl mx-1 group hover:bg-white/50 hover:backdrop-blur-lg hover:border hover:border-white/30"
                  >
                    {item.icon && (
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-[#0D5C63] transition-all duration-300 group-hover:from-[#0D5C63]/10 group-hover:to-[#0D5C63]/20 group-hover:scale-110">
                        <item.icon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="font-medium">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 text-[#0D5C63]" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub className="ml-4 mt-2 space-y-1 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-[#0D5C63]/30 before:via-[#0D5C63]/10 before:to-transparent">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                          className={`
                            transition-all duration-300 rounded-lg ml-3
                            ${pathname === subItem.url 
                              ? 'bg-white/70 backdrop-blur-md border border-white/40 text-[#0D5C63] font-semibold pl-3 border-l-2 border-l-[#0D5C63]' 
                              : 'hover:bg-white/40 hover:backdrop-blur-md hover:border hover:border-white/30 hover:translate-x-1'
                            }
                          `}
                        >
                          <Link href={subItem.url}>
                            <span className="font-medium text-sm">{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                tooltip={item.title}
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
                  {item.icon && (
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                      pathname === item.url 
                        ? 'bg-gradient-to-br from-[#0D5C63] to-[#0a4a50] text-white' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 text-[#0D5C63] group-hover:from-[#0D5C63]/10 group-hover:to-[#0D5C63]/20 group-hover:scale-110'
                    }`}>
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
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
