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
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { vehicleMakes, motorbikeBrands } from "@/constants/brands";
import { CitySearchDropdown } from "@/components/ui/city-search-dropdown";
import { ModelSearchDropdown } from "@/components/ui/model-search-dropdown";

interface VehicleGrade {
  id: string;
  name: string;
  model?: string | null;
  brand: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VehicleModel {
  id: string;
  name: string;
  brand: string;
}

const QUERY_KEY = ["vehicle-grades", "admin"];
const allBrands = [...new Set([...vehicleMakes, ...motorbikeBrands])].sort();

export default function VehicleGradesAdminPage() {
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; name: string } | null>(null);
  const [editGrade, setEditGrade] = useState<VehicleGrade | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [searchBrand, setSearchBrand] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchModelInput, setSearchModelInput] = useState("");

  const [form, setForm] = useState({ name: "", brand: "", model: "", isActive: true });

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: grades, isLoading, refetch } = useQuery({
    queryKey: [...QUERY_KEY, brandFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "500" });
      if (brandFilter) params.set("brand", brandFilter);
      params.set("includeUserGrades", "true");
      const res = await fetch(`/api/vehicle-grade?${params}`);
      if (!res.ok) throw new Error("Failed to fetch vehicle grades");
      const json = await res.json() as { grades: VehicleGrade[] };
      return json.grades;
    },
  });

  const { data: models = [] } = useQuery({
    queryKey: ["vehicle-models", searchBrand],
    queryFn: async () => {
      if (!searchBrand) return [];
      const params = new URLSearchParams({ limit: "500", brand: searchBrand, includeUserModels: "true" });
      const res = await fetch(`/api/vehicle-model?${params}`);
      if (!res.ok) throw new Error("Failed to fetch models");
      const json = await res.json() as { models: VehicleModel[] };
      return json.models;
    },
    enabled: !!searchBrand,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; brand?: string | null; model?: string | null; isActive: boolean }) => {
      const res = await fetch("/api/vehicle-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create vehicle grade");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Vehicle grade created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAddOpen(false);
      setForm({ name: "", brand: "", model: "", isActive: true });
      setSearchBrand("");
      setSearchModel("");
      setSearchModelInput("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, previousName }: { id: string; data: Partial<VehicleGrade>; previousName?: string }) => {
      // For user-added grades, use the create endpoint to promote them to database records
      if (id.startsWith("user:")) {
        const res = await fetch("/api/vehicle-grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name || previousName,
            brand: data.brand || null,
            model: data.model || null,
            isActive: data.isActive ?? true,
            previousGradeName: previousName,
            isUserAdded: true, // Flag to indicate this is promoting a user-added grade
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update vehicle grade");
        }
        return res.json();
      }
      const res = await fetch(`/api/vehicle-grade/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update vehicle grade");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Vehicle grade updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditOpen(false);
      setEditGrade(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, gradeName }: { id: string; gradeName: string }) => {
      // For user-added grades, clear them from all ads
      if (id.startsWith("user:")) {
        const res = await fetch("/api/vehicle-grade/clear-user-grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gradeName }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to delete vehicle grade");
        }
        return;
      }
      const res = await fetch(`/api/vehicle-grade/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete vehicle grade");
      }
    },
    onSuccess: () => {
      toast.success("Vehicle grade deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const filteredGrades = (grades || []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (g: VehicleGrade) => {
    setEditGrade(g);
    setForm({ name: g.name, brand: g.brand || "", model: g.model || "", isActive: g.isActive });
    setSearchBrand(g.brand || "");
    setSearchModel(g.model || "");
    setSearchModelInput(g.model || "");
    setEditOpen(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Vehicle Grades
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage vehicle grade suggestions shown in the ad forms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { 
            setForm({ name: "", brand: "", model: "", isActive: true }); 
            setSearchBrand("");
            setSearchModel("");
            setSearchModelInput("");
            setAddOpen(true); 
          }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Grade
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Grades</CardTitle>
          <CardDescription>
            {grades?.length ?? 0} grades total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search grades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <CitySearchDropdown
                cities={allBrands}
                value={brandFilter}
                onChange={(v) => setBrandFilter(v)}
                placeholder="All brands"
                triggerClassName="w-48"
              />
              {brandFilter && (
                <button
                  type="button"
                  onClick={() => setBrandFilter("")}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No vehicle grades found.{" "}
              <button
                onClick={() => { 
                  setForm({ name: "", brand: "", model: "", isActive: true }); 
                  setSearchBrand("");
                  setSearchModel("");
                  setSearchModelInput("");
                  setAddOpen(true); 
                }}
                className="text-primary underline"
              >
                Add the first one
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.brand || <span className="text-muted-foreground text-xs">Any</span>}</TableCell>
                    <TableCell>{g.model || <span className="text-muted-foreground text-xs">Any</span>}</TableCell>
                    <TableCell className="space-y-1">
                      <div className="flex gap-2">
                        <Badge variant={g.isActive ? "default" : "secondary"}>
                          {g.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {g.id.startsWith("user:") && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            User Added
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getRelativeTime(g.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEdit(g)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive "
                          onClick={() => setDeleteId({ id: g.id, name: g.name })}
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
        <DialogContent className="max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vehicle Grade</DialogTitle>
            <DialogDescription>
              Select a brand and model, then add a grade. Users can still type any grade not in this list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-brand">Brand *</Label>
              <CitySearchDropdown
                cities={allBrands}
                value={searchBrand}
                onChange={(v) => {
                  setSearchBrand(v);
                  setForm((f) => ({ ...f, brand: v }));
                  setSearchModel("");
                  setSearchModelInput("");
                }}
                placeholder="Select a brand"
                triggerClassName="w-full"
              />
            </div>

            {searchBrand && (
              <div className="space-y-2">
                <Label htmlFor="add-model">Model *</Label>
                <ModelSearchDropdown
                  value={searchModel}
                  onChange={(v) => {
                    setSearchModel(v);
                    setForm((f) => ({ ...f, model: v }));
                    setSearchModelInput(v);
                  }}
                  brand={searchBrand}
                  placeholder="Select or type model"
                />
                {models.length === 0 && (
                  <p className="text-xs text-muted-foreground">No models available for this brand</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-name">Grade Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g., A Grade, B Grade, Fair"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
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
            <Button 
              variant="outline" 
              onClick={() => {
                setAddOpen(false);
                setSearchBrand("");
                setSearchModel("");
                setSearchModelInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim() || !searchBrand || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: form.name.trim(),
                  brand: searchBrand || null,
                  model: searchModel || null,
                  isActive: form.isActive,
                })
              }
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Grade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle Grade</DialogTitle>
            <DialogDescription>Update the vehicle grade details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand *</Label>
              <CitySearchDropdown
                cities={allBrands}
                value={searchBrand}
                onChange={(v) => {
                  setSearchBrand(v);
                  setForm((f) => ({ ...f, brand: v }));
                  setSearchModel("");
                  setSearchModelInput("");
                }}
                placeholder="Select a brand"
                triggerClassName="w-full"
              />
            </div>

            {searchBrand && (
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model *</Label>
                <ModelSearchDropdown
                  value={searchModel}
                  onChange={(v) => {
                    setSearchModel(v);
                    setForm((f) => ({ ...f, model: v }));
                    setSearchModelInput(v);
                  }}
                  brand={searchBrand}
                  placeholder="Select or type model"
                />
                {models.length === 0 && (
                  <p className="text-xs text-muted-foreground">No models available for this brand</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Grade Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
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
              disabled={!form.name.trim() || !searchBrand || updateMutation.isPending}
              onClick={() =>
                editGrade &&
                updateMutation.mutate({
                  id: editGrade.id,
                  data: { name: form.name.trim(), brand: searchBrand || null, model: searchModel || null, isActive: form.isActive },
                  previousName: editGrade.name,
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
            <AlertDialogTitle>Delete Vehicle Grade</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the grade from suggestions. Existing ads using this grade will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId.id, gradeName: deleteId.name })}
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
