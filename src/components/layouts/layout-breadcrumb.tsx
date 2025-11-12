"use client";

import { useEffect, useState } from "react";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

export function LayoutBreadcrumb() {
  const pathname = usePathname();
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const pathList = pathname.slice(1).split("/");

  const pathListFormatted = pathname
    .slice(1)
    .split("/")
    .map((path) => path.charAt(0).toUpperCase() + path.slice(1));

  // Fetch user names for user IDs in the path
  useEffect(() => {
    const fetchUserNames = async () => {
      const usersIndex = pathList.indexOf("users");
      if (usersIndex !== -1 && pathList[usersIndex + 1]) {
        const userId = pathList[usersIndex + 1];
        // Check if it looks like a MongoDB ID (24 hex characters)
        if (userId.length === 24 && /^[a-f0-9]+$/i.test(userId)) {
          try {
            // Convert to lowercase for MongoDB case-sensitivity
            const userIdLower = userId.toLowerCase();
            const response = await fetch(`/api/users/${userIdLower}`, {
              credentials: "include",
            });
            if (response.ok) {
              const userData = await response.json();
              setUserNames((prev) => ({
                ...prev,
                [userId]: userData.name || userData.email,
              }));
            }
          } catch (error) {
            console.error("Failed to fetch user name:", error);
          }
        }
      }
    };

    fetchUserNames();
  }, [pathname]);

  const getDisplayName = (path: string, index: number) => {
    // Check if this is a user ID
    if (index > 0 && pathList[index - 1] === "users") {
      if (path.length === 24 && /^[a-f0-9]+$/i.test(path)) {
        return userNames[path] || "Loading...";
      }
    }
    return pathListFormatted[index];
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink
            href={`/${pathList[0]}`}
            className={
              pathList.length === 1 ? "dark:text-white text-black" : ""
            }
          >
            {pathListFormatted[0]}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathList.length > 1 &&
          pathList.slice(1).map((path, index) => (
            <div key={index} className="flex items-center gap-2">
              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/${pathList[0]}/${path}`}
                  className={
                    pathList.length === index + 2
                      ? "dark:text-white text-black"
                      : ""
                  }
                >
                  {getDisplayName(path, index + 1)}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
