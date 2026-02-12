"use client";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaMobileAlt, FaWhatsapp } from "react-icons/fa";
import { format } from "date-fns";

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

// Ad type matching the API response
export type DeletedAdType = {
  id: string;
  title: string;
  type: string;
  brand?: string;
  model?: string;
  manufacturedYear?: string;
  price?: number;
  status: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  creator?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  phoneNumber?: string;
  whatsappNumber?: string;
  name?: string;
  description?: string;
  condition?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  grade?: string;
  city?: string;
  location?: string;
  media?: Array<{
    id: string;
    media: {
      id: string;
      url: string;
    };
  }>;
};

// Helper function to generate ad title from components
const generateAdTitle = (ad: DeletedAdType): string => {
  return [ad.brand, ad.model, ad.manufacturedYear, vehicleTypeLabels[ad.type] || ad.type]
    .filter(Boolean)
    .join(' ') || ad.title || "Untitled Ad";
};

// Ad Details Modal Component
function AdDetailsModal({ ad, open, onOpenChange }: { ad: DeletedAdType; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = ad.media || [];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1));
  };

  const currentImage = images[currentImageIndex]?.media?.url;
  const metadata = (ad.metadata || {}) as Record<string, unknown>;
  const deletedAt = metadata.deletedAt as string | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ad Details (Deleted by User)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Slider */}
          {images.length > 0 ? (
            <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video">
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
              <p className="text-sm text-slate-800">{ad.mileage ? `${ad.mileage.toLocaleString()} km` : "—"}</p>
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
                {ad.price ? `Rs. ${ad.price.toLocaleString()}` : "Price on request"}
              </p>
            </div>
          </div>

          {/* Location Details */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">City</label>
              <p className="text-sm text-slate-800">{ad.city || "—"}</p>
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
                <p className="text-sm text-slate-800">{ad.creator?.name || ad.creator?.email || "Unknown"}</p>
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

          {/* Deletion Info */}
          <div className="border-t pt-4">
            <label className="text-xs font-semibold text-slate-600 block mb-2">Deletion Information</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Deleted At</p>
                <p className="text-sm text-slate-800">
                  {deletedAt ? format(new Date(deletedAt), "PPP") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Created At</p>
                <p className="text-sm text-slate-800">{format(new Date(ad.createdAt), "PPP")}</p>
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

// Actions Cell Component
function DeletedAdActionsCell({ ad, onDelete }: { ad: DeletedAdType; onDelete: (id: string) => void }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const handleDelete = () => {
    onDelete(ad.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetailsDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 border-0"
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      <AdDetailsModal
        ad={ad}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Ad?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ad and all its associated data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-100 hover:text-black" >Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const createDeletedAdColumns = (onDelete: (id: string) => void): ColumnDef<DeletedAdType>[] => [
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
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
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
      const type = ad.type;
      const displayType = vehicleTypeLabels[type] || type;

      return (
        <div className="flex flex-col gap-2">
          <div className="font-medium text-sm text-slate-800">
            {displayTitle}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Badge variant="outline" className="bg-slate-100 text-slate-800 border-1 w-fit border-amber-200">
              {displayType}
            </Badge>
            <Badge className="bg-gradient-to-r  text-red-500 border-1 border-red-500">
              Deleted by User
            </Badge>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.price;
      return price ? (
        <div className="font-medium">Rs. {price.toLocaleString()}</div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "creator",
    header: "Created By",
    cell: ({ row }) => {
      const ad = row.original;
      const creator = ad.creator;
      const formName = ad.name;
      
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-medium">Profile: {creator?.name || creator?.email || "Unknown"}</div>
          <div className="text-muted-foreground text-xs">Seller: {formName || "—"}</div>
        </div>
      );
    }
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
            <a href={`tel:${phone}`} className="text-teal-700 hover:underline">
              <span className="inline-flex items-center gap-2">
                <FaMobileAlt className="w-4 h-4" />
                <span className="inline">{phone}</span>
              </span>
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              <span className="inline-flex items-center gap-2">
                <FaWhatsapp className="w-4 h-4" />
                <span className="inline">{whatsapp}</span>
              </span>
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "metadata",
    header: "Deleted At",
    cell: ({ row }) => {
      const metadata = (row.original.metadata || {}) as Record<string, unknown>;
      const deletedAt = metadata.deletedAt as string | undefined;
      
      if (!deletedAt || typeof deletedAt !== 'string') {
        return <span className="text-muted-foreground">—</span>;
      }

      const date = new Date(deletedAt);
      
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">at {date.toLocaleTimeString()}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const ad = row.original;
      const date = new Date(ad.createdAt);
      
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">at {date.toLocaleTimeString()}</div>
        </div>
      );
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <DeletedAdActionsCell ad={row.original} onDelete={onDelete} />;
    }
  }
];
