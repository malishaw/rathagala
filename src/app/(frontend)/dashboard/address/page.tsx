"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocations } from "@/hooks/use-locations";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface City {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  _count?: { cities: number };
  cities?: City[];
}

interface Province {
  id: string;
  name: string;
  _count?: { districts: number };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchProvinces(): Promise<{ provinces: Province[] }> {
  const res = await fetch("/api/admin/locations/provinces");
  if (!res.ok) throw new Error("Failed to fetch provinces");
  return res.json();
}

async function fetchDistricts(provinceId: string): Promise<{ districts: District[] }> {
  const res = await fetch(`/api/admin/locations/districts?provinceId=${provinceId}`);
  if (!res.ok) throw new Error("Failed to fetch districts");
  return res.json();
}

async function fetchCities(districtId: string): Promise<{ cities: City[] }> {
  const res = await fetch(`/api/admin/locations/cities?districtId=${districtId}`);
  if (!res.ok) throw new Error("Failed to fetch cities");
  return res.json();
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AddressManagementPage() {
  const queryClient = useQueryClient();

  // Selection state
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // Dialog state
  const [provinceDialog, setProvinceDialog] = useState<{ open: boolean; edit?: Province }>({ open: false });
  const [districtDialog, setDistrictDialog] = useState<{ open: boolean; edit?: District }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; name: string } | null>(null);

  // Form state
  const [provinceName, setProvinceName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [citiesText, setCitiesText] = useState("");

  // Seeding state
  const [seeding, setSeeding] = useState(false);

  // Total counts (all provinces/districts/cities in DB)
  const { allDistricts, allCities } = useLocations();

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: provincesData, isLoading: loadingProvinces } = useQuery({
    queryKey: ["admin-provinces"],
    queryFn: fetchProvinces,
  });

  const { data: districtsData, isLoading: loadingDistricts } = useQuery({
    queryKey: ["admin-districts", selectedProvince?.id],
    queryFn: () => fetchDistricts(selectedProvince!.id),
    enabled: !!selectedProvince,
  });

  const { data: citiesData, isLoading: loadingCities } = useQuery({
    queryKey: ["admin-cities", selectedDistrict?.id],
    queryFn: () => fetchCities(selectedDistrict!.id),
    enabled: !!selectedDistrict,
  });

  // Sync citiesText when district changes
  const citiesTextForDistrict = citiesData?.cities.map((c) => c.name).join(", ") ?? "";

  // ─── Province mutations ───────────────────────────────────────────────────

  const createProvince = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/admin/locations/provinces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Province created");
      queryClient.invalidateQueries({ queryKey: ["admin-provinces"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setProvinceDialog({ open: false });
      setProvinceName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProvince = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/admin/locations/provinces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Province updated");
      queryClient.invalidateQueries({ queryKey: ["admin-provinces"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setProvinceDialog({ open: false });
      setProvinceName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProvince = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/locations/provinces/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Province deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-provinces"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      if (selectedProvince?.id === deleteDialog?.id) {
        setSelectedProvince(null);
        setSelectedDistrict(null);
      }
      setDeleteDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── District mutations ───────────────────────────────────────────────────

  const createDistrict = useMutation({
    mutationFn: async ({ name, provinceId }: { name: string; provinceId: string }) => {
      const res = await fetch("/api/admin/locations/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, provinceId }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("District created");
      queryClient.invalidateQueries({ queryKey: ["admin-districts", selectedProvince?.id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setDistrictDialog({ open: false });
      setDistrictName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateDistrict = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/admin/locations/districts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("District updated");
      queryClient.invalidateQueries({ queryKey: ["admin-districts", selectedProvince?.id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setDistrictDialog({ open: false });
      setDistrictName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteDistrict = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/locations/districts/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("District deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-districts", selectedProvince?.id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      if (selectedDistrict?.id === deleteDialog?.id) setSelectedDistrict(null);
      setDeleteDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Cities mutation ──────────────────────────────────────────────────────

  const saveCities = useMutation({
    mutationFn: async ({ districtId, citiesText }: { districtId: string; citiesText: string }) => {
      const res = await fetch("/api/admin/locations/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtId, citiesText }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.cities.length} cities saved`);
      queryClient.invalidateQueries({ queryKey: ["admin-cities", selectedDistrict?.id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Seed handler ─────────────────────────────────────────────────────────

  async function handleSeedFromEnv() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/locations/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      toast.success(
        `Seeded: ${data.provincesCreated} provinces, ${data.districtsCreated} districts, ${data.citiesCreated} cities`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-provinces"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const provinces = provincesData?.provinces ?? [];
  const districts = districtsData?.districts ?? [];
  const cities = citiesData?.cities ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Address Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage provinces, districts, and cities used throughout the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedFromEnv}
          disabled={seeding}
        >
          {seeding ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Import from ENV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provinces Column */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Provinces</CardTitle>
                <span className="text-sm text-muted-foreground font-normal">({provinces.length})</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setProvinceName("");
                  setProvinceDialog({ open: true });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingProvinces ? (
              <div className="px-4 pb-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : provinces.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                No provinces yet.{" "}
                <button
                  onClick={() => { setProvinceName(""); setProvinceDialog({ open: true }); }}
                  className="text-primary underline"
                >
                  Add one
                </button>{" "}
                or{" "}
                <button onClick={handleSeedFromEnv} className="text-primary underline">
                  import from ENV
                </button>
                .
              </p>
            ) : (
              <ul className="divide-y">
                {provinces.map((p) => (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedProvince?.id === p.id ? "bg-muted" : ""
                    }`}
                    onClick={() => {
                      setSelectedProvince(p);
                      setSelectedDistrict(null);
                      setCitiesText("");
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedProvince?.id === p.id ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProvinceName(p.name);
                          setProvinceDialog({ open: true, edit: p });
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({ open: true, type: "province", id: p.id, name: p.name });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Districts Column */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Districts</CardTitle>
                <span className="text-sm text-muted-foreground font-normal">
                  ({selectedProvince ? districts.length : allDistricts.length})
                </span>
              </div>
              {selectedProvince && (
                <Button
                  size="sm"
                  onClick={() => {
                    setDistrictName("");
                    setDistrictDialog({ open: true });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedProvince ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                Select a province to view its districts.
              </p>
            ) : loadingDistricts ? (
              <div className="px-4 pb-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : districts.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                No districts yet.{" "}
                <button
                  onClick={() => { setDistrictName(""); setDistrictDialog({ open: true }); }}
                  className="text-primary underline"
                >
                  Add one
                </button>
                .
              </p>
            ) : (
              <ul className="divide-y">
                {districts.map((d) => (
                  <li
                    key={d.id}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedDistrict?.id === d.id ? "bg-muted" : ""
                    }`}
                    onClick={() => {
                      setSelectedDistrict(d);
                      setCitiesText("");
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedDistrict?.id === d.id ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDistrictName(d.name);
                          setDistrictDialog({ open: true, edit: d });
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({ open: true, type: "district", id: d.id, name: d.name });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Cities Column */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Cities</CardTitle>
              <span className="text-sm text-muted-foreground font-normal">
                ({selectedDistrict ? cities.length : allCities.length})
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedDistrict ? (
              <p className="text-sm text-muted-foreground">
                Select a district to manage its cities.
              </p>
            ) : loadingCities ? (
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-9 w-24" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cities-textarea">
                    Cities{" "}
                    <span className="text-muted-foreground font-normal">(comma-separated)</span>
                  </Label>
                  <Textarea
                    id="cities-textarea"
                    key={selectedDistrict.id}
                    defaultValue={citiesTextForDistrict}
                    onChange={(e) => setCitiesText(e.target.value)}
                    placeholder="e.g. Colombo, Dehiwala, Mount Lavinia"
                    className="min-h-[140px] resize-y text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate each city with a comma. Saving will replace all existing cities.
                  </p>
                </div>

                {/* Preview */}
                {(citiesText || citiesTextForDistrict) && (
                  <div className="flex flex-wrap gap-1">
                    {(citiesText || citiesTextForDistrict)
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((city, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {city}
                        </Badge>
                      ))}
                  </div>
                )}

                <Button
                  size="sm"
                  disabled={saveCities.isPending}
                  onClick={() =>
                    saveCities.mutate({
                      districtId: selectedDistrict.id,
                      citiesText: citiesText || citiesTextForDistrict,
                    })
                  }
                >
                  {saveCities.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Save Cities
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Province Dialog */}
      <Dialog
        open={provinceDialog.open}
        onOpenChange={(o) => !o && setProvinceDialog({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {provinceDialog.edit ? "Edit Province" : "Add Province"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="province-name">Province Name</Label>
              <Input
                id="province-name"
                value={provinceName}
                onChange={(e) => setProvinceName(e.target.value)}
                placeholder="e.g. Western"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && provinceName.trim()) {
                    if (provinceDialog.edit) {
                      updateProvince.mutate({ id: provinceDialog.edit.id, name: provinceName });
                    } else {
                      createProvince.mutate(provinceName);
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProvinceDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              disabled={!provinceName.trim() || createProvince.isPending || updateProvince.isPending}
              onClick={() => {
                if (provinceDialog.edit) {
                  updateProvince.mutate({ id: provinceDialog.edit.id, name: provinceName });
                } else {
                  createProvince.mutate(provinceName);
                }
              }}
            >
              {(createProvince.isPending || updateProvince.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {provinceDialog.edit ? "Save Changes" : "Add Province"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* District Dialog */}
      <Dialog
        open={districtDialog.open}
        onOpenChange={(o) => !o && setDistrictDialog({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {districtDialog.edit ? "Edit District" : "Add District"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="district-name">District Name</Label>
              <Input
                id="district-name"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                placeholder="e.g. Colombo"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && districtName.trim() && selectedProvince) {
                    if (districtDialog.edit) {
                      updateDistrict.mutate({ id: districtDialog.edit.id, name: districtName });
                    } else {
                      createDistrict.mutate({ name: districtName, provinceId: selectedProvince.id });
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDistrictDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              disabled={!districtName.trim() || createDistrict.isPending || updateDistrict.isPending}
              onClick={() => {
                if (districtDialog.edit) {
                  updateDistrict.mutate({ id: districtDialog.edit.id, name: districtName });
                } else if (selectedProvince) {
                  createDistrict.mutate({ name: districtName, provinceId: selectedProvince.id });
                }
              }}
            >
              {(createDistrict.isPending || updateDistrict.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {districtDialog.edit ? "Save Changes" : "Add District"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog?.type === "province" ? "Province" : "District"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteDialog?.name}</strong>?{" "}
              {deleteDialog?.type === "province"
                ? "All districts and cities within it will also be deleted."
                : "All cities within it will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteDialog) return;
                if (deleteDialog.type === "province") {
                  deleteProvince.mutate(deleteDialog.id);
                } else {
                  deleteDistrict.mutate(deleteDialog.id);
                }
              }}
            >
              {(deleteProvince.isPending || deleteDistrict.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
