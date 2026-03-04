"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

interface AutoPartCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const QUERY_KEY = ["auto-part-categories", "admin"];

export default function AutoPartsAdminPage() {
  const queryClient = useQueryClient();

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<AutoPartCategory | null>(null);

  // Form state
  const [form, setForm] = useState({ name: "", description: "", isActive: true });

  // ─────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/auto-part-category?limit=200");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json() as { categories: AutoPartCategory[] };
      return json.categories;
    },
  });

  // ─────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isActive: boolean }) => {
      const res = await fetch("/api/auto-part-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err?.error ?? "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAddOpen(false);
      setForm({ name: "", description: "", isActive: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean } }) => {
      const res = await fetch(`/api/auto-part-category/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err?.error ?? "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditOpen(false);
      setEditCategory(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/auto-part-category/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err?.error ?? "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const openAdd = () => {
    setForm({ name: "", description: "", isActive: true });
    setAddOpen(true);
  };

  const openEdit = (cat: AutoPartCategory) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description ?? "", isActive: cat.isActive });
    setEditOpen(true);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return toast.error("Category name is required");
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    });
  };

  const handleEdit = () => {
    if (!editCategory) return;
    if (!form.name.trim()) return toast.error("Category name is required");
    updateMutation.mutate({
      id: editCategory.id,
      data: {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      },
    });
  };

  const toggleActive = (cat: AutoPartCategory) => {
    updateMutation.mutate({ id: cat.id, data: { isActive: !cat.isActive } });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6 text-teal-700" />
            Auto Parts Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the category list shown when posting auto part ads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={openAdd} className="bg-teal-700 hover:bg-teal-800">
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{categories?.length ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-teal-700">
              {categories?.filter((c) => c.isActive).length ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription>Inactive</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-slate-400">
              {categories?.filter((c) => !c.isActive).length ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No categories yet</p>
              <p className="text-sm mt-1">Click &quot;Add Category&quot; to create your first one</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-50 truncate">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggleActive(cat)} className="flex items-center gap-1.5 group">
                        <Badge
                          variant={cat.isActive ? "default" : "secondary"}
                          className={`text-xs ${cat.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : "hover:bg-slate-200"}`}
                        >
                          {cat.isActive ? (
                            <><Check className="h-3 w-3 mr-1" />Active</>
                          ) : (
                            <><X className="h-3 w-3 mr-1" />Inactive</>
                          )}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-teal-700"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          onClick={() => setDeleteId(cat.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Add Modal ─── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new auto parts category visible to users when posting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="add-name"
                placeholder="e.g. Engine Parts"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-desc">Description</Label>
              <Textarea
                id="add-desc"
                placeholder="Optional description..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="add-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="add-active" className="cursor-pointer">
                Active <span className="text-muted-foreground text-xs">(visible to users)</span>
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 hover:bg-teal-800"
              onClick={handleAdd}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Modal ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                placeholder="e.g. Engine Parts"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                placeholder="Optional description..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Active <span className="text-muted-foreground text-xs">(visible to users)</span>
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 hover:bg-teal-800"
              onClick={handleEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Existing ads linked to this category will retain the reference but the category will no longer appear in dropdown menus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
