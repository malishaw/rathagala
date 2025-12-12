"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  Users,
  AlertCircle,
  MoreHorizontal,
  Ban,
  Check,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

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

interface BanUserData {
  banReason: string;
  banDuration: "1h" | "1d" | "7d" | "30d" | "permanent";
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banData, setBanData] = useState<BanUserData>({
    banReason: "",
    banDuration: "7d",
  });
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "user",
    phone: "",
    whatsappNumber: "",
    province: "",
    district: "",
    city: "",
    location: "",
  });

  const router = useRouter();
  const { data, isLoading: isLoadingUsers, refetch } = useGetUsers({
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

  const getBanExpiresIn = (duration: string): number | undefined => {
    switch (duration) {
      case "1h":
        return 60 * 60;
      case "1d":
        return 60 * 60 * 24;
      case "7d":
        return 60 * 60 * 24 * 7;
      case "30d":
        return 60 * 60 * 24 * 30;
      case "permanent":
        return undefined;
      default:
        return 60 * 60 * 24 * 7;
    }
  };

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banData.banReason.trim()) {
      toast.error("Please provide a ban reason");
      return;
    }

    setIsLoading(selectedUser.id);
    try {
      const requestBody = {
        userId: selectedUser.id,
        banReason: banData.banReason.trim(),
        ...(banData.banDuration !== "permanent" && {
          banExpiresIn: getBanExpiresIn(banData.banDuration),
        }),
      };

      const response = await fetch("/api/auth/admin/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("User banned successfully", {
        description: `${selectedUser.name || selectedUser.email} has been banned.`,
      });

      setBanData({ banReason: "", banDuration: "7d" });
      setBanDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleUnban = async (user: User) => {
    setIsLoading(user.id);
    try {
      const response = await fetch("/api/auth/admin/unban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("User unbanned successfully", {
        description: `${user.name || user.email} has been unbanned.`,
      });

      refetch();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      phone: "",
      whatsappNumber: "",
      province: "",
      district: "",
      city: "",
      location: "",
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!editData.name.trim() || !editData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setIsLoading(selectedUser.id);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: editData.name.trim(),
          email: editData.email.trim(),
          role: editData.role,
          phone: editData.phone || undefined,
          whatsappNumber: editData.whatsappNumber || undefined,
          province: editData.province || undefined,
          district: editData.district || undefined,
          city: editData.city || undefined,
          location: editData.location || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("User updated successfully", {
        description: `${editData.name} has been updated.`,
      });

      setEditDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsLoading(selectedUser.id);
    try {
      const response = await fetch("/api/auth/admin/remove-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("User deleted successfully", {
        description: `${selectedUser.name || selectedUser.email} has been removed from the system.`,
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(null);
    }
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
    <div className="space-y-6 p-10">
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
                disabled={isLoadingUsers}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingUsers ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
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
                      <TableHead className="text-right">Actions</TableHead>
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

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isLoading === user.id}
                              >
                                {isLoading === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditClick(user)}
                                disabled={isLoading === user.id}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.banned ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnban(user)}
                                  disabled={isLoading === user.id}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Unban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleBanClick(user)}
                                  disabled={isLoading === user.id}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600"
                                disabled={isLoading === user.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.name || selectedUser?.email} from the platform.
              This action can be reversed later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banReason">Ban Reason *</Label>
              <Textarea
                id="banReason"
                placeholder="Enter the reason for banning this user"
                value={banData.banReason}
                onChange={(e) =>
                  setBanData((prev) => ({ ...prev, banReason: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banDuration">Ban Duration</Label>
              <Select
                value={banData.banDuration}
                onValueChange={(
                  value: "1h" | "1d" | "7d" | "30d" | "permanent"
                ) => setBanData((prev) => ({ ...prev, banDuration: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ban duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setBanData({ banReason: "", banDuration: "7d" });
              }}
              disabled={isLoading === selectedUser?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={
                !banData.banReason.trim() || isLoading === selectedUser?.id
              }
            >
              {isLoading === selectedUser?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Ban User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              {selectedUser?.name || selectedUser?.email}? This action cannot be
              undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>User account and profile</li>
                    <li>All posts and associated data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={isLoading === selectedUser?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isLoading === selectedUser?.id}
            >
              {isLoading === selectedUser?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit User Details
            </DialogTitle>
            <DialogDescription>
              Update the details for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info Summary */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={selectedUser.image || undefined}
                    alt={selectedUser.name || selectedUser.email}
                  />
                  <AvatarFallback className="bg-[#024950] text-white">
                    {selectedUser.name?.[0]?.toUpperCase() ||
                      selectedUser.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {selectedUser.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-500">ID: {selectedUser.id}</p>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(selectedUser.emailVerified, selectedUser.banned)}
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Name *</Label>
                    <Input
                      id="editName"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter user name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={editData.role}
                    onValueChange={(value) =>
                      setEditData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPhone">Phone</Label>
                    <Input
                      id="editPhone"
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editWhatsapp">WhatsApp Number</Label>
                    <Input
                      id="editWhatsapp"
                      value={editData.whatsappNumber}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                      }
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editProvince">Province</Label>
                    <Input
                      id="editProvince"
                      value={editData.province}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, province: e.target.value }))
                      }
                      placeholder="Province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDistrict">District</Label>
                    <Input
                      id="editDistrict"
                      value={editData.district}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, district: e.target.value }))
                      }
                      placeholder="District"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCity">City</Label>
                    <Input
                      id="editCity"
                      value={editData.city}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editLocation">Location</Label>
                  <Input
                    id="editLocation"
                    value={editData.location}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Enter detailed location"
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Email verification status and ban status
                  are managed through their respective actions in the dropdown menu.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={isLoading === selectedUser?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={
                !editData.name.trim() ||
                !editData.email.trim() ||
                isLoading === selectedUser?.id
              }
            >
              {isLoading === selectedUser?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}