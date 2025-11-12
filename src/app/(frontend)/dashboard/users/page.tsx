"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";

import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { DataTable } from "@/components/table/data-table";
import { DataTableSearch } from "@/components/table/data-table-search";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetUsers } from "@/features/users/api/use-get-users";

type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  banned: boolean;
};

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "image",
      header: "Avatar",
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || user.email[0].toUpperCase();
        
        return (
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name || "No Name"}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const banned = row.original.banned;
        return (
          <Badge variant={banned ? "destructive" : "default"}>
            {banned ? "Banned" : "Active"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-sm text-muted-foreground">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Store user data in session storage for the next page
              sessionStorage.setItem('viewingUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
              }));
              router.push(`/dashboard/users/${user.id}/ads`);
            }}
          >
            View Ads
          </Button>
        );
      },
    },
  ];

  const { data, isLoading, error } = useGetUsers({
    page,
    limit,
    search: search || "",
  });

  if (error) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="Users Management"
            description="View and manage all registered users"
            actionComponent={null}
          />
          <Separator />
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive">Error: {error.message}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AppPageShell
          title="Users Management"
          description="View and manage all registered users"
          actionComponent={null}
        />

        <Separator />

        <DataTableSearch 
          searchKey="name"
          searchQuery={search || ""}
          setSearchQuery={setSearch}
          setPage={setPage}
        />

        {isLoading ? (
          <DataTableSkeleton columnCount={6} searchableColumnCount={1} />
        ) : (
          <DataTable
            columns={columns}
            data={data?.users || []}
            totalItems={data?.pagination.total || 0}
          />
        )}
      </div>
    </PageContainer>
  );
}
