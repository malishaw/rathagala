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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Car,
  RefreshCw,
} from "lucide-react";
import { vehicleMakes, motorbikeBrands } from "@/constants/brands";

interface VehicleModel {
  id: string;
  name: string;
  brand: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const QUERY_KEY = ["vehicle-models", "admin"];
const allBrands = [...new Set([...vehicleMakes, ...motorbikeBrands])].sort();

export default function VehicleModelsAdminPage() {
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; name: string } | null>(null);
  const [editModel, setEditModel] = useState<VehicleModel | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const [form, setForm] = useState({ name: "", brand: "", isActive: true });

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: models, isLoading, refetch } = useQuery({
    queryKey: [...QUERY_KEY, brandFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "500" });
      if (brandFilter) params.set("brand", brandFilter);
      params.set("includeUserModels", "true");
      const res = await fetch(`/api/vehicle-model?${params}`);
      if (!res.ok) throw new Error("Failed to fetch vehicle models");
      const json = await res.json() as { models: VehicleModel[] };
      return json.models;
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; brand?: string | null; isActive: boolean }) => {
      const res = await fetch("/api/vehicle-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create vehicle model");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Vehicle model created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAddOpen(false);
      setForm({ name: "", brand: "", isActive: true });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, previousName }: { id: string; data: Partial<VehicleModel>; previousName?: string }) => {
      // For user-added models, use the create endpoint to promote them to database records
      if (id.startsWith("user:")) {
        const res = await fetch("/api/vehicle-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name || previousName,
            brand: data.brand || null,
            isActive: data.isActive ?? true,
            previousModelName: previousName,
            isUserAdded: true, // Flag to indicate this is promoting a user-added model
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update vehicle model");
        }
        return res.json();
      }
      const res = await fetch(`/api/vehicle-model/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update vehicle model");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Vehicle model updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditOpen(false);
      setEditModel(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, modelName }: { id: string; modelName: string }) => {
      // For user-added models, clear them from all ads
      if (id.startsWith("user:")) {
        const res = await fetch("/api/vehicle-model/clear-user-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelName }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to delete vehicle model");
        }
        return;
      }
      const res = await fetch(`/api/vehicle-model/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete vehicle model");
      }
    },
    onSuccess: () => {
      toast.success("Vehicle model deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const filteredModels = (models || []).filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (m: VehicleModel) => {
    setEditModel(m);
    setForm({ name: m.name, brand: m.brand || "", isActive: m.isActive });
    setEditOpen(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6" />
            Vehicle Models
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage vehicle model suggestions shown in the ad forms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setForm({ name: "", brand: "", isActive: true }); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Model
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Models</CardTitle>
          <CardDescription>
            {models?.length ?? 0} models total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">All brands</option>
              {allBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No vehicle models found.{" "}
              <button
                onClick={() => { setForm({ name: "", brand: "", isActive: true }); setAddOpen(true); }}
                className="text-primary underline"
              >
                Add the first one
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.brand || <span className="text-muted-foreground text-xs">Any</span>}</TableCell>
                    <TableCell className="space-y-1">
                      <div className="flex gap-2">
                        <Badge variant={m.isActive ? "default" : "secondary"}>
                          {m.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {m.id.startsWith("user:") && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            User Added
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive "
                          onClick={() => setDeleteId({ id: m.id, name: m.name })}
                        >
                          <Trash2 className="h-4 w-4 hover:text-white" />
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vehicle Model</DialogTitle>
            <DialogDescription>
              Add a new model to the suggestion list. Users can still type any model not in this list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Model Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g., Camry"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-brand">Brand (optional)</Label>
              <select
                id="add-brand"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Any brand</option>
                {allBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Leave blank to show for all brands.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="add-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="add-active">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.name.trim() || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: form.name.trim(),
                  brand: form.brand || null,
                  isActive: form.isActive,
                })
              }
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Model
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle Model</DialogTitle>
            <DialogDescription>Update the vehicle model details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Model Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand (optional)</Label>
              <select
                id="edit-brand"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Any brand</option>
                {allBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.name.trim() || updateMutation.isPending}
              onClick={() =>
                editModel &&
                updateMutation.mutate({
                  id: editModel.id,
                  data: { name: form.name.trim(), brand: form.brand || null, isActive: form.isActive },
                  previousName: editModel.name,
                })
              }
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Model</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the model from suggestions. Existing ads using this model will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId.id, modelName: deleteId.name })}
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
