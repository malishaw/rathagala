"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Palette, Plus, Pencil, Trash2, Loader2, Sparkles, Search, Check } from "lucide-react";

interface VehicleColor {
  id: string;
  name: string;
  hexCode: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchAdminColors(): Promise<{ colors: VehicleColor[] }> {
  const res = await fetch("/api/admin/colors", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch vehicle colors");
  return res.json();
}

export default function ColorsManagementPage() {
  const queryClient = useQueryClient();

  const [colorDialog, setColorDialog] = useState<{
    open: boolean;
    edit?: VehicleColor;
  }>({ open: false });

  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [hexInput, setHexInput] = useState("#000000");
  const [orderInput, setOrderInput] = useState<number>(0);
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-colors"],
    queryFn: fetchAdminColors,
  });

  const colors = data?.colors ?? [];

  // Filtered colors based on search
  const filteredColors = colors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const totalPages = Math.ceil(filteredColors.length / itemsPerPage);
  const paginatedColors = filteredColors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateDialog = () => {
    setNameInput("");
    setHexInput("#024950");
    setOrderInput(colors.length + 1);
    setIsActiveInput(true);
    setColorDialog({ open: true });
  };

  const openEditDialog = (color: VehicleColor) => {
    setNameInput(color.name);
    setHexInput(color.hexCode || "#000000");
    setOrderInput(color.order ?? 0);
    setIsActiveInput(color.isActive ?? true);
    setColorDialog({ open: true, edit: color });
  };

  const createColor = useMutation({
    mutationFn: async (payload: { name: string; hexCode: string; order: number; isActive: boolean }) => {
      const res = await fetch("/api/admin/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to create color");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Color created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-colors"] });
      setColorDialog({ open: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateColor = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name: string;
      hexCode: string;
      order: number;
      isActive: boolean;
    }) => {
      const res = await fetch(`/api/admin/colors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to update color");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Color updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-colors"] });
      setColorDialog({ open: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteColor = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/colors/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to delete color");
      }
    },
    onSuccess: () => {
      toast.success("Color deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-colors"] });
      setDeleteDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedColors = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/colors/seed", { method: "POST" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to seed colors");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Default colors seeded successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-colors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error("Color name is required");
      return;
    }

    if (colorDialog.edit) {
      updateColor.mutate({
        id: colorDialog.edit.id,
        name: nameInput.trim(),
        hexCode: hexInput,
        order: orderInput,
        isActive: isActiveInput,
      });
    } else {
      createColor.mutate({
        name: nameInput.trim(),
        hexCode: hexInput,
        order: orderInput,
        isActive: isActiveInput,
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-700/10 text-teal-700">
              <Palette className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Vehicle Colors</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage available vehicle colors for ad creation and search filters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {colors.length === 0 && !isLoading && (
            <Button
              variant="outline"
              onClick={() => seedColors.mutate()}
              disabled={seedColors.isPending}
              className="gap-1.5"
            >
              {seedColors.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
              Seed Defaults
            </Button>
          )}

          <Button
            onClick={openCreateDialog}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Color
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Color Catalogue ({filteredColors.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Colors configured for ad listing forms and marketplace attributes
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search colors..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8.5 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredColors.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                <Palette className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-foreground">No colors found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "No colors match your search query. Try typing a different term."
                  : "You haven't added any vehicle colors yet. Click Seed Defaults or Add Color to get started."}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  onClick={() => seedColors.mutate()}
                  disabled={seedColors.isPending}
                  className="bg-teal-700 hover:bg-teal-800 text-white mt-2"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Seed Default Colors
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {paginatedColors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card hover:border-border transition-all hover:shadow-xs group select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Color Preview Swatch */}
                      <div
                        className="w-8 h-8 rounded-lg border border-black/10 shadow-inner flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color.hexCode || "#cccccc" }}
                        title={color.hexCode || undefined}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {color.name}
                          </span>
                          {!color.isActive && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground border-border">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {color.hexCode || "No Hex"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(color)}
                        title="Edit Color"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteDialog({ id: color.id, name: color.name })}
                        title="Delete Color"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Color Dialog */}
      <Dialog
        open={colorDialog.open}
        onOpenChange={(open) => {
          if (!open) setColorDialog({ open: false });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {colorDialog.edit ? "Edit Color" : "Add New Color"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="color-name" className="text-xs font-semibold">
                Color Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="color-name"
                placeholder="e.g., Pearl White, Metallic Silver, Deep Blue"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hex-code" className="text-xs font-semibold">
                Hex Code (Optional)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={hexInput.startsWith("#") && hexInput.length === 7 ? hexInput : "#024950"}
                  onChange={(e) => setHexInput(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-lg border border-border cursor-pointer shrink-0 bg-transparent"
                />
                <Input
                  id="hex-code"
                  placeholder="#024950"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="color-order" className="text-xs font-semibold">
                  Display Order
                </Label>
                <Input
                  id="color-order"
                  type="number"
                  placeholder="0"
                  value={orderInput}
                  onChange={(e) => setOrderInput(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex flex-col justify-between space-y-1.5 pb-1">
                <Label htmlFor="color-active" className="text-xs font-semibold">
                  Active Status
                </Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id="color-active"
                    checked={isActiveInput}
                    onCheckedChange={setIsActiveInput}
                  />
                  <span className="text-xs text-muted-foreground font-medium">
                    {isActiveInput ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setColorDialog({ open: false })}
                disabled={createColor.isPending || updateColor.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createColor.isPending || updateColor.isPending}
                className="bg-teal-700 hover:bg-teal-800 text-white"
              >
                {createColor.isPending || updateColor.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </span>
                ) : colorDialog.edit ? (
                  "Update Color"
                ) : (
                  "Create Color"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the color &quot;{deleteDialog?.name}&quot;? Existing vehicle ads
              with this color will preserve their text value, but it will no longer be listed as a selectable option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteColor.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && deleteColor.mutate(deleteDialog.id)}
              disabled={deleteColor.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteColor.isPending ? "Deleting..." : "Delete Color"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
