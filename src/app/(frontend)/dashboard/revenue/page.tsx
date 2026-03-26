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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { TrendingUp, Star, AlertCircle, Zap, DollarSign, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

  const ad = data as Record<string, unknown> | undefined;
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

type RevenueFilter = "today" | "7days" | "30days" | "all";

const BOOST_LABELS: Record<string, string> = {
  BUMP: "Bump Up",
  TOP_AD: "Top Ad",
  URGENT: "Urgent",
  FEATURED: "Featured",
};

export default function RevenueAdminPage() {
  const [filter, setFilter] = useState<RevenueFilter>("all");
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const { data, isLoading } = useGetRevenue(filter);

  const cards = [
    {
      label: "Bump Up",
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      amount: data?.bumpRevenue ?? 0,
      bg: "bg-blue-50 border-blue-200",
    },
    {
      label: "Top Ad",
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      amount: data?.topAdRevenue ?? 0,
      bg: "bg-yellow-50 border-yellow-200",
    },
    {
      label: "Urgent Ad",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      amount: data?.urgentRevenue ?? 0,
      bg: "bg-red-50 border-red-200",
    },
    {
      label: "Featured Ad",
      icon: <Zap className="h-5 w-5 text-purple-500" />,
      amount: data?.featuredRevenue ?? 0,
      bg: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <AppPageShell
            title="Revenue"
            description="Track revenue from boost promotions"
            actionComponent={<div />}
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as RevenueFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            {/* Total Revenue */}
            <Card className="p-6 bg-teal-900 text-white border-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 opacity-80" />
                  <div>
                    <p className="text-teal-200 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold">Rs. {(data?.totalRevenue ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  {[
                    { label: "Bump Up", count: data?.bumpCount ?? 0, icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    { label: "Top Ad", count: data?.topAdCount ?? 0, icon: <Star className="h-3.5 w-3.5" /> },
                    { label: "Urgent", count: data?.urgentCount ?? 0, icon: <AlertCircle className="h-3.5 w-3.5" /> },
                    { label: "Featured", count: data?.featuredCount ?? 0, icon: <Zap className="h-3.5 w-3.5" /> },
                    { label: "Total", count: data?.totalBoostedCount ?? 0, icon: <DollarSign className="h-3.5 w-3.5" /> },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/15 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                      {item.icon}
                      <span className="text-xs text-teal-200">{item.label}</span>
                      <span className="text-sm font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Active Urgent", count: data?.activeUrgentCount ?? 0, icon: <AlertCircle className="h-4 w-4" /> },
                  { label: "Active Featured", count: data?.activeFeaturedCount ?? 0, icon: <Zap className="h-4 w-4" /> },
                  { label: "Active Top Ad", count: data?.activeTopAdCount ?? 0, icon: <Star className="h-4 w-4" /> },
                  { label: "Active Bump Up", count: data?.activeBumpCount ?? 0, icon: <TrendingUp className="h-4 w-4" /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg px-4 py-3 flex flex-col gap-1 bg-white/10"
                  >
                    <div className="flex items-center gap-1.5 text-teal-200 text-xs font-medium">
                      {item.icon}
                      {item.label}
                    </div>
                    <p className="text-2xl font-bold">{item.count}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Per-Boost Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <Card key={card.label} className={`p-5 border ${card.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {card.icon}
                    <span className="text-sm font-medium text-slate-700">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    Rs. {card.amount.toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>

            {/* Revenue Records Table */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Records</h3>
              {!data?.records || data.records.length === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  No revenue records found for this period.
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">Ad</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">User</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">Boost Types</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-700">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-700">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(data.records as any[]).map((record: any) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">
                              {record.boostRequest?.ad?.brand} {record.boostRequest?.ad?.model}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {record.boostRequest?.user?.name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(record.boostTypes as string[]).map((t) => (
                                <Badge key={t} variant="secondary" className="text-xs">
                                  {BOOST_LABELS[t] || t}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-teal-700">
                            Rs. {record.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {getRelativeTime(record.recordedAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {record.boostRequest?.ad?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 h-auto bg-teal-700 text-white hover:bg-teal-800"
                                onClick={() => setSelectedAdId(record.boostRequest.ad.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
