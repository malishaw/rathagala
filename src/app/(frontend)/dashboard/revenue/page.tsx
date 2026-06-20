"use client";

import { useState } from "react";
import { useGetRevenue } from "@/features/boost/api/use-get-revenue";
import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Image from "next/image";
import { TrendingUp, Star, AlertCircle, Zap, Loader2, Eye, ChevronLeft, ChevronRight, FileDown, Search } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car", VAN: "Van", SUV_JEEP: "SUV / Jeep", MOTORCYCLE: "Motorcycle",
  CREW_CAB: "Crew Cab", PICKUP_DOUBLE_CAB: "Pickup / Double Cab", BUS: "Bus",
  LORRY: "Lorry", THREE_WHEEL: "Three Wheeler", OTHER: "Other", TRACTOR: "Tractor",
  HEAVY_DUTY: "Heavy-Duty", BICYCLE: "Bicycle", AUTO_PARTS: "Auto Parts",
  AUTO_SERVICE: "Auto Service", RENTAL: "Rental",
};

function AdDetailsModal({ adId, open, onOpenChange }: { adId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["ad-detail-revenue", adId],
    queryFn: async () => {
      const res = await client.api.ad[":id"].$get({ param: { id: adId } });
      if (!res.ok) throw new Error("Failed to fetch ad");
      return res.json();
    },
    enabled: open && !!adId,
  });

  const ad = data as Record<string, any> | undefined;
  const images = (ad?.media as { media: { url: string } }[]) || [];
  const currentImage = images[currentImageIndex]?.media?.url;

  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % (images.length || 1));
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + (images.length || 1)) % (images.length || 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ad Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : !ad ? (
          <p className="text-sm text-slate-500 py-4">Ad not found.</p>
        ) : (
          <div className="space-y-4">
            {images.length > 0 ? (
              <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video">
                <Image src={currentImage || "/placeholder-image.jpg"} alt="Ad" fill className="object-cover" />
                {images.length > 1 && (
                  <>
                    <Button size="sm" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1" onClick={prevImage}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1" onClick={nextImage}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">No images available</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-slate-600">Make</label><p className="text-sm text-slate-800">{ad.brand || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Model</label><p className="text-sm text-slate-800">{ad.model || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Year</label><p className="text-sm text-slate-800">{ad.manufacturedYear || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Type</label><p className="text-sm text-slate-800">{vehicleTypeLabels[ad.type] || ad.type || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Condition</label><p className="text-sm text-slate-800 capitalize">{ad.condition || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Mileage</label><p className="text-sm text-slate-800">{ad.mileage ? `${ad.mileage.toLocaleString()} km` : "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Fuel Type</label><p className="text-sm text-slate-800">{ad.fuelType || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Transmission</label><p className="text-sm text-slate-800 capitalize">{ad.transmission || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Grade</label><p className="text-sm text-slate-800">{ad.grade || "—"}</p></div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Price</label>
                <p className="text-sm font-semibold text-teal-700">
                  {ad.price ? `Rs. ${ad.price.toLocaleString()}` : (ad.metadata?.isNegotiable ? "Negotiable" : "Price on request")}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-slate-600">City</label><p className="text-sm text-slate-800">{ad.city || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">District</label><p className="text-sm text-slate-800">{ad.district || "—"}</p></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-slate-600">Location</label><p className="text-sm text-slate-800">{ad.location || "—"}</p></div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div><label className="text-xs font-semibold text-slate-600">Title</label><p className="text-sm text-slate-800">{ad.title || "—"}</p></div>
              <div><label className="text-xs font-semibold text-slate-600">Description</label><p className="text-sm text-slate-800 max-h-24 overflow-y-auto">{ad.description || "—"}</p></div>
            </div>

            <div className="border-t pt-4">
              <label className="text-xs font-semibold text-slate-600 block mb-2">Seller Information</label>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-600">Name</p><p className="text-sm text-slate-800">{ad.creator?.name || ad.creator?.email || "Unknown"}</p></div>
                <div><p className="text-xs text-slate-600">Seller Name (Form)</p><p className="text-sm text-slate-800">{ad.name || "—"}</p></div>
                <div><p className="text-xs text-slate-600">Phone</p><p className="text-sm text-slate-800">{ad.phoneNumber || "—"}</p></div>
                <div><p className="text-xs text-slate-600">WhatsApp</p><p className="text-sm text-slate-800">{ad.whatsappNumber || "—"}</p></div>
                <div><p className="text-xs text-slate-600">Email</p><p className="text-sm text-slate-800 break-all">{ad.creator?.email || "—"}</p></div>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-600">Status</p><p className="text-sm font-medium text-slate-800">{ad.status || "—"}</p></div>
              <div><p className="text-xs text-slate-600">Created</p><p className="text-sm text-slate-800">{ad.createdAt ? getRelativeTime(ad.createdAt) : "—"}</p></div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RevenueFilter = "today" | "7days" | "30days" | "all" | "custom";

const BOOST_LABELS: Record<string, string> = {
  BUMP: "Bump Up",
  TOP_AD: "Top Ad",
  URGENT: "Urgent",
  FEATURED: "Featured",
};

export default function RevenueAdminPage() {
  const [filter, setFilter] = useState<RevenueFilter>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "expired">("all");
  const [boostTypeFilter, setBoostTypeFilter] = useState<"all" | "BUMP" | "TOP_AD" | "URGENT" | "FEATURED">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 20;

  const { data, isLoading } = useGetRevenue(
    filter,
    filter === "custom" && startDate ? startDate : undefined,
    filter === "custom" && endDate ? endDate : undefined,
    currentPage,
    RECORDS_PER_PAGE
  );

  const records = data?.records ?? [];
  const filteredRecords = records.filter((record: any) => {
    // 1. Status Filter
    const adStatus = record.boostRequest?.ad?.status;
    if (statusFilter === "live" && adStatus !== "ACTIVE") return false;
    if (statusFilter === "expired" && adStatus !== "EXPIRED") return false;

    // 2. Boost Type Filter
    if (boostTypeFilter !== "all" && !record.boostTypes?.includes(boostTypeFilter)) return false;

    // 3. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const adName = `${record.boostRequest?.ad?.brand || ""} ${record.boostRequest?.ad?.model || ""}`.toLowerCase();
      const userName = (record.boostRequest?.user?.name || "").toLowerCase();
      if (!adName.includes(q) && !userName.includes(q)) return false;
    }

    return true;
  });

  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    
    const headers = ["Ad", "Ad Status", "User", "Boost Types", "Amount (LKR)", "Date"];
    const rows = filteredRecords.map((r: any) => [
      `"${r.boostRequest?.ad?.brand || ""} ${r.boostRequest?.ad?.model || ""}"`,
      r.boostRequest?.ad?.status === "ACTIVE" ? "Live" : "Expired",
      `"${r.boostRequest?.user?.name || ""}"`,
      `"${r.boostTypes?.join(", ") || ""}"`,
      r.totalAmount,
      new Date(r.recordedAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `revenue_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cards = [
    {
      label: "Bump Up",
      icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
      amount: data?.bumpRevenue ?? 0,
      border: "border-slate-200/60",
    },
    {
      label: "Top Ad",
      icon: <Star className="h-4 w-4 text-yellow-500" />,
      amount: data?.topAdRevenue ?? 0,
      border: "border-slate-200/60",
    },
    {
      label: "Urgent Ad",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      amount: data?.urgentRevenue ?? 0,
      border: "border-slate-200/60",
    },
    {
      label: "Featured Ad",
      icon: <Zap className="h-4 w-4 text-purple-500" />,
      amount: data?.featuredRevenue ?? 0,
      border: "border-slate-200/60",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <AppPageShell
            title="Revenue"
            description="Track revenue from boost promotions"
            actionComponent={<div />}
          />
          <div className="flex flex-wrap items-center gap-2">
            {filter === "custom" && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs w-[120px] bg-white border-slate-200"
                />
                <span className="text-slate-400 text-xs">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs w-[120px] bg-white border-slate-200"
                />
              </div>
            )}
            <Select value={filter} onValueChange={(v) => {
              setFilter(v as RevenueFilter);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filter period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            {/* Total Revenue - Compact Flat UI */}
            <Card className="p-4 bg-white border border-slate-200/60 rounded-xl">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-bold text-slate-800">Rs. {(data?.totalRevenue ?? 0).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Bump Up", count: data?.bumpCount ?? 0 },
                    { label: "Top Ad", count: data?.topAdCount ?? 0 },
                    { label: "Urgent", count: data?.urgentCount ?? 0 },
                    { label: "Featured", count: data?.featuredCount ?? 0 },
                    { label: "Total Boosts", count: data?.totalBoostedCount ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="border border-slate-200/60 rounded px-2 py-0.5 flex items-center gap-1 bg-slate-50 text-[10px]">
                      <span className="text-slate-500 font-medium">{item.label}:</span>
                      <span className="font-bold text-slate-800">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
                {[
                  { label: "Active Urgent", count: data?.activeUrgentCount ?? 0, icon: <AlertCircle className="h-3.5 w-3.5" /> },
                  { label: "Active Featured", count: data?.activeFeaturedCount ?? 0, icon: <Zap className="h-3.5 w-3.5" /> },
                  { label: "Active Top Ad", count: data?.activeTopAdCount ?? 0, icon: <Star className="h-3.5 w-3.5" /> },
                  { label: "Active Bump Up", count: data?.activeBumpCount ?? 0, icon: <TrendingUp className="h-3.5 w-3.5" /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg p-2 flex flex-col gap-0.5 border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-1 text-slate-400 text-[9px] font-semibold">
                      {item.icon}
                      {item.label}
                    </div>
                    <p className="text-base font-bold text-slate-800">{item.count}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Per-Boost Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {cards.map((card) => (
                <Card key={card.label} className={`p-3 bg-white border ${card.border} rounded-xl`}>
                  <div className="flex items-center gap-2 mb-1">
                    {card.icon}
                    <span className="text-[10px] font-semibold text-slate-500">{card.label}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    Rs. {card.amount.toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>

            {/* Revenue Records Table Section */}
            <div>
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revenue Records</h3>
                  <div className="relative w-full sm:w-[200px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      placeholder="Search ad or user..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-7 h-7 text-xs w-full bg-white border-slate-200"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    <Select value={statusFilter} onValueChange={(v) => {
                      setStatusFilter(v as any);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-[100px] h-7 text-[10px] bg-white">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="live">Live Only</SelectItem>
                        <SelectItem value="expired">Expired Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Type:</span>
                    <Select value={boostTypeFilter} onValueChange={(v) => {
                      setBoostTypeFilter(v as any);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-[110px] h-7 text-[10px] bg-white">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="BUMP">Bump Up</SelectItem>
                        <SelectItem value="TOP_AD">Top Ad</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="FEATURED">Featured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={filteredRecords.length === 0}
                    className="h-7 text-xs flex items-center gap-1 bg-white hover:bg-slate-50 border-slate-200"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <Card className="p-8 text-center text-slate-400 text-xs border border-slate-200/60">
                  No revenue records found for this period.
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-slate-200/60 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200/60">
                        <tr>
                          <th className="text-left px-2.5 py-2 font-semibold text-slate-500">Ad</th>
                          <th className="text-left px-2.5 py-2 font-semibold text-slate-500">Ad Status</th>
                          <th className="text-left px-2.5 py-2 font-semibold text-slate-500">User</th>
                          <th className="text-left px-2.5 py-2 font-semibold text-slate-500">Boost Types</th>
                          <th className="text-right px-2.5 py-2 font-semibold text-slate-500">Amount</th>
                          <th className="text-left px-2.5 py-2 font-semibold text-slate-500">Date</th>
                          <th className="text-center px-2.5 py-2 font-semibold text-slate-500">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecords.map((record: any) => {
                          const adStatus = record.boostRequest?.ad?.status;
                          return (
                            <tr key={record.id} className="hover:bg-slate-50/50">
                              <td className="px-2.5 py-1.5">
                                <span className="font-semibold text-slate-800">
                                  {record.boostRequest?.ad?.brand} {record.boostRequest?.ad?.model}
                                </span>
                              </td>
                              <td className="px-2.5 py-1.5">
                                {adStatus === "ACTIVE" ? (
                                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 text-[9px] font-semibold py-0.5 px-1.5">Live</Badge>
                                ) : adStatus === "EXPIRED" ? (
                                  <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 text-[9px] font-semibold py-0.5 px-1.5">Expired</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] font-medium py-0.5 px-1.5">{adStatus || "—"}</Badge>
                                )}
                              </td>
                              <td className="px-2.5 py-1.5 text-slate-500">
                                {record.boostRequest?.user?.name || "—"}
                              </td>
                              <td className="px-2.5 py-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {(record.boostTypes as string[]).map((t) => (
                                    <Badge key={t} variant="secondary" className="text-[9px] font-medium py-0 px-1">
                                      {BOOST_LABELS[t] || t}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-bold text-teal-700">
                                Rs. {record.totalAmount.toLocaleString()}
                              </td>
                              <td className="px-2.5 py-1.5 text-slate-400">
                                {getRelativeTime(record.recordedAt)}
                              </td>
                              <td className="px-2.5 py-1.5 text-center">
                                {record.boostRequest?.ad?.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-1 h-auto bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded"
                                    onClick={() => setSelectedAdId(record.boostRequest.ad.id)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(p => p - 1);
                              }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }).map((_, i) => {
                          const page = i + 1;
                          if (totalPages > 7 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return null;
                          }

                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                isActive={page === currentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(p => p + 1);
                              }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedAdId && (
        <AdDetailsModal
          adId={selectedAdId}
          open={!!selectedAdId}
          onOpenChange={(open) => { if (!open) setSelectedAdId(null); }}
        />
      )}
    </PageContainer>
  );
}
