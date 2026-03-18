import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NavUser } from "@/components/layouts/nav-groups/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";

import { auth, type Session } from "@/lib/auth";

import AppSidebarContent from "./app-sidebar-content";
import { OrgSwitcher } from "@/features/organizations/components/org-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({
      headers: await headers()
    });
  } catch (error) {
    // No active organization, this is expected for new users
    console.log("No active organization found");
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-teal-900 hover:bg-teal-50 border border-white/20 shadow-sm transition-colors text-sm font-medium"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="leading-5">Back</span>
          </Link>

          <OrgSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <AppSidebarContent
          session={props.session}
          activeMember={activeMember}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            email: props.session.user.email,
            avatar: props.session.user.image ?? "",
            name: props.session.user.name
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
