"use client";

import { useState, useEffect } from "react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  const res = await fetch("/api/admin/locations/provinces", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch provinces");
  return res.json();
}

async function fetchDistricts(provinceId: string): Promise<{ districts: District[] }> {
  const res = await fetch(`/api/admin/locations/districts?provinceId=${provinceId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch districts");
  return res.json();
}

async function fetchCities(districtId: string): Promise<{ cities: City[] }> {
  const res = await fetch(`/api/admin/locations/cities?districtId=${districtId}`, { cache: "no-store" });
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

  // Total counts
  const { allDistricts, allCities } = useLocations();

  // Pagination
  const [provincePage, setProvincePage] = useState(1);
  const [districtPage, setDistrictPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    if (citiesData?.cities) {
      setCitiesText(citiesData.cities.map((c) => c.name).join(", "));
    } else {
      setCitiesText("");
    }
  }, [citiesData, selectedDistrict?.id]);

  // ─── Province mutations ───────────────────────────────────────────────────

  const createProvince = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/admin/locations/provinces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
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
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
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
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
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
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
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
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
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
      toast.success(`Seeded: ${data.provincesCreated} provinces, ${data.districtsCreated} districts, ${data.citiesCreated} cities`);
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

  const totalProvincePages = Math.ceil(provinces.length / itemsPerPage);
  const paginatedProvinces = provinces.slice((provincePage - 1) * itemsPerPage, provincePage * itemsPerPage);

  const totalDistrictPages = Math.ceil(districts.length / itemsPerPage);
  const paginatedDistricts = districts.slice((districtPage - 1) * itemsPerPage, districtPage * itemsPerPage);

  return (
    <div className="p-4 sm:p-5 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <MapPin className="h-5 w-5 text-primary" />
            Address Management
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Manage provinces, districts, and cities used throughout the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs self-start sm:self-auto"
          onClick={handleSeedFromEnv}
          disabled={seeding}
        >
          {seeding ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1.5" />
          )}
          Import from ENV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Provinces Column */}
        <Card className="shadow-sm border">
          <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-semibold">Provinces</CardTitle>
                <Badge variant="secondary" className="text-[11px] h-4 px-1.5 font-normal">
                  {provinces.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-6 w-6 p-0 rounded"
                onClick={() => {
                  setProvinceName("");
                  setProvinceDialog({ open: true });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingProvinces ? (
              <div className="p-3 space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : provinces.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">
                No provinces yet.{" "}
                <button
                  onClick={() => {
                    setProvinceName("");
                    setProvinceDialog({ open: true });
                  }}
                  className="text-primary underline font-medium"
                >
                  Add one
                </button>{" "}
                or{" "}
                <button
                  onClick={handleSeedFromEnv}
                  className="text-primary underline font-medium"
                >
                  import from ENV
                </button>
                .
              </p>
            ) : (
              <ul className="divide-y text-xs">
                {paginatedProvinces.map((p) => (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-muted/60 transition-colors ${
                      selectedProvince?.id === p.id ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                    onClick={() => {
                      setSelectedProvince(p);
                      setSelectedDistrict(null);
                      setCitiesText("");
                      setDistrictPage(1);
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {selectedProvince?.id === p.id ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{p.name}</span>
                      {p._count?.districts !== undefined && (
                        <span className="text-[10px] text-muted-foreground">
                          ({p._count.districts})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted"
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
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({
                            open: true,
                            type: "province",
                            id: p.id,
                            name: p.name,
                          });
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
          {!loadingProvinces && totalProvincePages > 1 && (
            <div className="py-1.5 border-t bg-muted/10">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setProvincePage((p) => Math.max(1, p - 1))}
                      className={`h-6 px-1.5 text-xs ${
                        provincePage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"
                      }`}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-[11px] text-muted-foreground px-1">
                      {provincePage} / {totalProvincePages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setProvincePage((p) => Math.min(totalProvincePages, p + 1))}
                      className={`h-6 px-1.5 text-xs ${
                        provincePage === totalProvincePages ? "pointer-events-none opacity-40" : "cursor-pointer"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>

        {/* Districts Column */}
        <Card className="shadow-sm border">
          <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-semibold">Districts</CardTitle>
                <Badge variant="secondary" className="text-[11px] h-4 px-1.5 font-normal">
                  {selectedProvince ? districts.length : allDistricts.length}
                </Badge>
              </div>
              {selectedProvince && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 w-6 p-0 rounded"
                  onClick={() => {
                    setDistrictName("");
                    setDistrictDialog({ open: true });
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedProvince ? (
              <p className="p-4 text-xs text-muted-foreground text-center">
                Select a province to view its districts.
              </p>
            ) : loadingDistricts ? (
              <div className="p-3 space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : districts.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">
                No districts yet.{" "}
                <button
                  onClick={() => {
                    setDistrictName("");
                    setDistrictDialog({ open: true });
                  }}
                  className="text-primary underline font-medium"
                >
                  Add one
                </button>
                .
              </p>
            ) : (
              <ul className="divide-y text-xs">
                {paginatedDistricts.map((d) => (
                  <li
                    key={d.id}
                    className={`flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-muted/60 transition-colors ${
                      selectedDistrict?.id === d.id ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                    onClick={() => {
                      setSelectedDistrict(d);
                      setCitiesText("");
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {selectedDistrict?.id === d.id ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{d.name}</span>
                      {d._count?.cities !== undefined && (
                        <span className="text-[10px] text-muted-foreground">
                          ({d._count.cities})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted"
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
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({
                            open: true,
                            type: "district",
                            id: d.id,
                            name: d.name,
                          });
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
          {!loadingDistricts && totalDistrictPages > 1 && (
            <div className="py-1.5 border-t bg-muted/10">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setDistrictPage((p) => Math.max(1, p - 1))}
                      className={`h-6 px-1.5 text-xs ${
                        districtPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"
                      }`}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-[11px] text-muted-foreground px-1">
                      {districtPage} / {totalDistrictPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setDistrictPage((p) => Math.min(totalDistrictPages, p + 1))}
                      className={`h-6 px-1.5 text-xs ${
                        districtPage === totalDistrictPages ? "pointer-events-none opacity-40" : "cursor-pointer"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>

        {/* Cities Column */}
        <Card className="shadow-sm border">
          <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-semibold">Cities</CardTitle>
              <Badge variant="secondary" className="text-[11px] h-4 px-1.5 font-normal">
                {selectedDistrict ? cities.length : allCities.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3.5">
            {!selectedDistrict ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Select a district to manage its cities.
              </p>
            ) : loadingCities ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-7 w-20" />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="cities-textarea" className="text-xs font-medium">
                    Cities <span className="text-muted-foreground font-normal">(comma-separated)</span>
                  </Label>
                  <Textarea
                    id="cities-textarea"
                    value={citiesText}
                    onChange={(e) => setCitiesText(e.target.value)}
                    placeholder="e.g. Colombo, Dehiwala, Mount Lavinia"
                    className="min-h-[100px] resize-y text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Separate each city with a comma. Saving will update all cities for this district.
                  </p>
                </div>
                {citiesText && (
                  <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto p-1.5 bg-muted/30 rounded border border-border/50">
                    {citiesText
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((city, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 h-4 font-normal"
                        >
                          {city}
                        </Badge>
                      ))}
                  </div>
                )}
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs w-full sm:w-auto"
                  disabled={saveCities.isPending || !selectedDistrict}
                  onClick={() =>
                    saveCities.mutate({
                      districtId: selectedDistrict.id,
                      citiesText,
                    })
                  }
                >
                  {saveCities.isPending && (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  )}
                  Save Cities
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Province Dialog */}
      <Dialog open={provinceDialog.open} onOpenChange={(o) => !o && setProvinceDialog({ open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {provinceDialog.edit ? "Edit Province" : "Add Province"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="province-name" className="text-xs">
                Province Name
              </Label>
              <Input
                id="province-name"
                value={provinceName}
                onChange={(e) => setProvinceName(e.target.value)}
                placeholder="e.g. Western"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && provinceName.trim()) {
                    if (provinceDialog.edit)
                      updateProvince.mutate({ id: provinceDialog.edit.id, name: provinceName });
                    else createProvince.mutate(provinceName);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setProvinceDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              disabled={!provinceName.trim() || createProvince.isPending || updateProvince.isPending}
              onClick={() => {
                if (provinceDialog.edit)
                  updateProvince.mutate({ id: provinceDialog.edit.id, name: provinceName });
                else createProvince.mutate(provinceName);
              }}
            >
              {(createProvince.isPending || updateProvince.isPending) && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              {provinceDialog.edit ? "Save Changes" : "Add Province"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* District Dialog */}
      <Dialog open={districtDialog.open} onOpenChange={(o) => !o && setDistrictDialog({ open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {districtDialog.edit ? "Edit District" : "Add District"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="district-name" className="text-xs">
                District Name
              </Label>
              <Input
                id="district-name"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                placeholder="e.g. Colombo"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && districtName.trim() && selectedProvince) {
                    if (districtDialog.edit)
                      updateDistrict.mutate({ id: districtDialog.edit.id, name: districtName });
                    else
                      createDistrict.mutate({
                        name: districtName,
                        provinceId: selectedProvince.id,
                      });
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setDistrictDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              disabled={!districtName.trim() || createDistrict.isPending || updateDistrict.isPending}
              onClick={() => {
                if (districtDialog.edit)
                  updateDistrict.mutate({ id: districtDialog.edit.id, name: districtName });
                else if (selectedProvince)
                  createDistrict.mutate({
                    name: districtName,
                    provinceId: selectedProvince.id,
                  });
              }}
            >
              {(createDistrict.isPending || updateDistrict.isPending) && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              {districtDialog.edit ? "Save Changes" : "Add District"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Delete {deleteDialog?.type === "province" ? "Province" : "District"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete <strong>{deleteDialog?.name}</strong>?{" "}
              {deleteDialog?.type === "province"
                ? "All districts and cities within it will also be deleted."
                : "All cities within it will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="h-7 text-xs px-3">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-7 text-xs px-3 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteDialog) return;
                if (deleteDialog.type === "province") deleteProvince.mutate(deleteDialog.id);
                else deleteDistrict.mutate(deleteDialog.id);
              }}
            >
              {(deleteProvince.isPending || deleteDistrict.isPending) && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
