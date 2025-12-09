"use client";

import { useState } from "react";
import { useGetUsers } from "@/features/users/api/use-get-users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, Users, AlertCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  createdAt: string;
  emailVerified: boolean;
  banned: boolean;
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, refetch } = useGetUsers({
    page,
    limit: 10,
    search,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const getRoleBadge = (role: string | null) => {
    const userRole = role || "user";
    switch (userRole.toLowerCase()) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Admin
          </Badge>
        );
      case "user":
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            User
          </Badge>
        );
    }
  };

  const getStatusBadge = (emailVerified: boolean, banned: boolean) => {
    if (banned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (emailVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    }
    return <Badge variant="outline">Unverified</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-2">
          Manage and monitor all users in the system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {data?.pagination.total || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {data?.users.filter((u: User) => u.emailVerified && !u.banned)
                .length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Banned Users</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {data?.users.filter((u: User) => u.banned).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Users List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearch} size="sm">
                Search
              </Button>
              {search && (
                <Button onClick={handleClearSearch} variant="outline" size="sm">
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data || data.users.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {search ? "No users found matching your search" : "No users found"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email Verified</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user: User) => (
                      <TableRow key={user.id}>
                        {/* User Info */}
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={user.image || undefined}
                                alt={user.name || user.email}
                              />
                              <AvatarFallback className="text-sm bg-[#024950] text-white">
                                {user.name?.[0]?.toUpperCase() ||
                                  user.email?.[0]?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>{getRoleBadge(user.role)}</TableCell>

                        {/* Status */}
                        <TableCell>
                          {getStatusBadge(user.emailVerified, user.banned)}
                        </TableCell>

                        {/* Email Verified */}
                        <TableCell>
                          {user.emailVerified ? (
                            <span className="text-green-600 text-sm">✓ Verified</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not verified</span>
                          )}
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, data.pagination.total)} of{" "}
                    {data.pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">
                        Page {page} of {data.pagination.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}