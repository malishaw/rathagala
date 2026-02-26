"use client";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import type { Ad } from "@/types/schema-types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { FaMobileAlt, FaWhatsapp } from "react-icons/fa";
import { usePermanentDeleteAd } from "../../api/use-permanent-delete-ad";

// This type is used to define the shape of our data.
export type ExpiredAdType = Omit<Ad, "createdAt" | "boostExpiry" | "featureExpiry" | "expiryDate"> & {
  createdAt: string;
  boostExpiry?: string | Date | null;
  featureExpiry?: string | Date | null;
  expiryDate?: string | Date | null;
  grade?: string | null;
  district?: string | null;
  media?: Array<{ id: string; media: { id: string; url: string } }>;
  creator?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
  };
};

// Vehicle type labels mapping
const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car",
  VAN: "Van",
  SUV_JEEP: "SUV / Jeep",
  MOTORCYCLE: "Motorcycle",
  CREW_CAB: "Crew Cab",
  PICKUP_DOUBLE_CAB: "Pickup / Double Cab",
  BUS: "Bus",
  LORRY: "Lorry",
  THREE_WHEEL: "Three Wheeler",
  OTHER: "Other",
  TRACTOR: "Tractor",
  HEAVY_DUTY: "Heavy-Duty",
  BICYCLE: "Bicycle"
};

// Helper function to generate ad title from components
const generateAdTitle = (ad: ExpiredAdType): string => {
  return [ad.brand, ad.model, ad.manufacturedYear, vehicleTypeLabels[ad.type] || ad.type]
    .filter(Boolean)
    .join(' ') || ad.title || "Untitled Ad";
};

export const expiredAdColumns: ColumnDef<ExpiredAdType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Ad Title",
    cell: ({ row }) => {
      const ad = row.original;
      const displayTitle = generateAdTitle(ad);
      const displayType = vehicleTypeLabels[ad.type] || ad.type;
      return (
        <div className="flex flex-col gap-2">
          <span className="font-medium text-sm">{displayTitle}</span>
          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-1 w-fit border-amber-200">
            {displayType}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const ad = row.original;
      const creator = ad.creator;
      const formName = ad.name;
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-medium">Profile: {creator?.name || creator?.email || "Unknown"}</div>
          <div className="text-muted-foreground text-xs">seller: {formName || "—"}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Contact No",
    cell: ({ row }) => {
      const ad = row.original;
      const phone = ad.phoneNumber;
      const whatsapp = ad.whatsappNumber;
      return (
        <div className="flex flex-col gap-1 text-sm">
          {phone ? (
            <span className="text-teal-700 inline-flex items-center gap-2">
              <FaMobileAlt className="w-4 h-4" />
              {phone}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {whatsapp ? (
            <span className="text-green-600 inline-flex items-center gap-2">
              <FaWhatsapp className="w-4 h-4" />
              {whatsapp}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">at {date.toLocaleTimeString()}</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ExpiredViewCell ad={row.original} />
        <ExpiredDeleteCell ad={row.original} />
      </div>
    ),
  },
];

// View cell — single "View Ad" button that opens the details modal
function ExpiredViewCell({ ad }: { ad: ExpiredAdType }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-8 gap-1 border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye className="w-4 h-4" />
        View Ad
      </Button>
      <AdDetailsModal ad={ad} open={open} onOpenChange={setOpen} />
    </>
  );
}

// Delete cell — single "Delete" button with confirmation
function ExpiredDeleteCell({ ad }: { ad: ExpiredAdType }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteMutation = usePermanentDeleteAd();

  const handleDelete = () => {
    deleteMutation.mutate(ad.id);
    setConfirmOpen(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        className="h-8 gap-1 border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700"
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this ad? This action cannot be undone.
              All associated data including images will be completely removed.
              <br />
              <br />
              <strong>Ad:</strong> {generateAdTitle(ad)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}





// Ad Details Modal Component (same as ads-manage eye icon)
function AdDetailsModal({
  ad,
  open,
  onOpenChange,
}: {
  ad: ExpiredAdType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = ad.media || [];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % (images.length || 1));
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1));

  const currentImage = images[currentImageIndex]?.media?.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ad Details (Expired)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Slider */}
          {images.length > 0 ? (
            <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage || "/placeholder-image.jpg"}
                alt="Ad"
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
              No images available
            </div>
          )}

          {/* Vehicle Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Make</label>
              <p className="text-sm text-slate-800">{ad.brand || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Model</label>
              <p className="text-sm text-slate-800">{ad.model || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Year</label>
              <p className="text-sm text-slate-800">{ad.manufacturedYear || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Type</label>
              <p className="text-sm text-slate-800">{vehicleTypeLabels[ad.type] || ad.type || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Condition</label>
              <p className="text-sm text-slate-800 capitalize">{ad.condition || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Mileage</label>
              <p className="text-sm text-slate-800">
                {ad.mileage ? `${ad.mileage.toLocaleString()} km` : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Fuel Type</label>
              <p className="text-sm text-slate-800">{ad.fuelType || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Transmission</label>
              <p className="text-sm text-slate-800 capitalize">{ad.transmission || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Grade</label>
              <p className="text-sm text-slate-800">{ad.grade || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Price</label>
              <p className="text-sm font-semibold text-teal-700">
                {ad.price
                  ? (
                    <>
                      {`Rs. ${ad.price.toLocaleString()}`}
                      {(ad.metadata as Record<string, unknown>)?.isNegotiable && (
                        <div className="text-lg font-normal opacity-70"> Negotiable</div>
                      )}
                    </>
                  )
                  : (ad.metadata as Record<string, unknown>)?.isNegotiable
                  ? "Negotiable"
                  : "Price on request"}
              </p>
            </div>
          </div>

          {/* Location Details */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">City</label>
              <p className="text-sm text-slate-800">{ad.city || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">District</label>
              <p className="text-sm text-slate-800">{ad.district || "—"}</p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600">Location</label>
              <p className="text-sm text-slate-800">{ad.location || "—"}</p>
            </div>
          </div>

          {/* Title & Description */}
          <div className="border-t pt-4 space-y-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Title</label>
              <p className="text-sm text-slate-800">{ad.title || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Description</label>
              <p className="text-sm text-slate-800 max-h-24 overflow-y-auto">{ad.description || "—"}</p>
            </div>
          </div>

          {/* Seller Information */}
          <div className="border-t pt-4">
            <label className="text-xs font-semibold text-slate-600 block mb-2">Seller Information</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Name</p>
                <p className="text-sm text-slate-800">
                  {ad.creator?.name || ad.creator?.email || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Seller Name (Form)</p>
                <p className="text-sm text-slate-800">{ad.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Phone</p>
                <p className="text-sm text-slate-800">{ad.phoneNumber || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">WhatsApp</p>
                <p className="text-sm text-slate-800">{ad.whatsappNumber || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Email</p>
                <p className="text-sm text-slate-800 break-all">{ad.creator?.email || "—"}</p>
              </div>
            </div>
          </div>


        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
