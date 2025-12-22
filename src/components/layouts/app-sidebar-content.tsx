/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  GraduationCapIcon,
  LayoutDashboard,
  ShieldIcon,
  UsersRoundIcon,
  NewspaperIcon,
  Users,
  Flag
} from "lucide-react";

import { type Session } from "@/lib/auth";
import { NavMain } from "@/components/layouts/nav-groups/nav-main";
import { NavOrgManagement } from "./nav-groups/nav-org-management";
import { NavContent } from "./nav-groups/nav-content";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type Props = {
  activeMember: any;
  session: Session;
};

export default function AppSidebarContent({ activeMember, session }: Props) {
  const activeOrganization = authClient.useActiveOrganization();
  const router = useRouter();

  useEffect(() => {
    if (activeOrganization) router.refresh();
  }, [activeOrganization]);

  // Check if user is admin
  const isAdmin = (session?.user as any)?.role === "admin";

  const data = {
    teams: [
      {
        name: "Acme Inc",
        logo: GalleryVerticalEnd,
        plan: "Enterprise"
      },
      {
        name: "Acme Corp.",
        logo: AudioWaveform,
        plan: "Startup"
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free"
      }
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard
      }
    ],
    // Admin-only navigation items
    adminNavMain: [
      {
        title: "Ads Manage",
        url: "/dashboard/ads-manage",
        icon: NewspaperIcon
      },
      {
        title: "Organizations",
        url: "/dashboard/organizations",
        icon: UsersRoundIcon
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users
      },
      {
        title: "Reported Ads",
        url: "/dashboard/reports",
        icon: Flag
      },
      {
        title: "Reports",
        url: "/dashboard/report",
        icon: NewspaperIcon
      }
    ],
    agentManagement: [
      {
        name: "Admins", // Agent Admins
        url: "/dashboard/admins",
        icon: ShieldIcon,
        roles: ["owner"] // owner -> agent admin
      },
      {
        name: "Managers", // Agent Managers
        url: "/dashboard/managers",
        icon: GraduationCapIcon,
        roles: ["owner"] // owner -> agent manager
      }
      // {
      //   name: "Parents",
      //   url: "/dashboard/parents",
      //   icon: UsersIcon,
      //   roles: ["admin", "owner"]
      // }
    ],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getContents: (isAdmin: boolean) => [
      {
        title: "Ads",
        url: "/dashboard/ads",
        icon: NewspaperIcon,
        roles: ["owner", "admin", "member"]
      }
    ]
  };

  return (
    <>
      {/* Main navigation - available to all users */}
      <NavMain items={data.navMain} />

      {/* Admin-only navigation items */}
      {isAdmin && <NavMain items={data.adminNavMain} />}

      {/* Organization Management - only for admins */}
      {isAdmin && activeOrganization.data && activeMember?.role !== "member" && (
        <NavOrgManagement
          cmLinks={data.agentManagement}
          activeMemberRole={activeMember?.role || null}
        />
      )}

      {/* Content navigation - available to organization members */}
      <NavContent
        items={data.getContents(
          activeMember?.role === "owner" || activeMember?.role === "admin"
        )}
      />
      {/* Settings section removed as requested */}
    </>
  );
}
