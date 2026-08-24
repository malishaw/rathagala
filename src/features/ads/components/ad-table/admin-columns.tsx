"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import type { Ad } from "@/types/schema-types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useApproveAd } from "@/features/ads/api/use-approve-ad";
import { useRejectAd } from "@/features/ads/api/use-reject-ad";
import { useDeleteAd } from "@/features/ads/api/use-delete-ad";
import { BoostApproveDialog } from "@/features/boost/components/boost-approve-dialog";
import { AdminPromoteDialog } from "@/features/boost/components/admin-promote-dialog";
import { QuickEditAdModal } from "@/features/ads/components/quick-edit-ad-modal";
import {
  Check,
  X,
  Eye,
  Edit,
  SlidersHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Car,
  Image as ImageIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { FaInfoCircle, FaMobileAlt, FaWhatsapp } from "react-icons/fa";
import { cn, getRelativeTime } from "@/lib/utils";
import { DELETE_AD_REASONS, type DeleteAdReason } from "@/constants/delete-reasons";

// This type is used to define the shape of our data.
export type AdType = Omit<Ad, "createdAt" | "updatedAt" | "boostExpiry" | "boostRequestedAt" | "boostStartAt" | "boostEndAt"> & {
  createdAt: string;
  updatedAt: string | Date;
  boostExpiry?: string | Date | null;
  boostRequestedAt?: string | Date | null;
  boostStartAt?: string | Date | null;
  boostEndAt?: string | Date | null;
  boostStatus?: string | null;
  creator?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
  };
  user?: {
    name?: string | null;
    phone?: string | null;
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
  BICYCLE: "Bicycle",
  AUTO_PARTS: "Auto Parts",
  AUTO_SERVICE: "Auto Service",
  RENTAL: "Rental",
  MAINTENANCE: "Maintenance",
  BOAT: "Boat",
  ALL: "All Vehicles"
};

// Status badge colors - compact micro styling
const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] px-1.5 py-0 font-medium">
          Active
        </Badge>
      );
    case "PENDING_REVIEW":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] px-1.5 py-0 font-medium">
          Pending
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 text-[10px] px-1.5 py-0 font-medium">
          Rejected
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge className="bg-slate-400 hover:bg-slate-500 text-white border-0 text-[10px] px-1.5 py-0 font-medium">
          Draft
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge className="bg-slate-400 hover:bg-slate-500 text-white border-0 text-[10px] px-1.5 py-0 font-medium">
          Expired
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-400 text-white border-0 text-[10px] px-1.5 py-0 font-medium">
          {status}
        </Badge>
      );
  }
};

// Helper function to generate ad title from components
const generateAdTitle = (ad: AdType): string => {
  if (ad.type === "AUTO_PARTS") {
    const adExt = ad as AdType & { partName?: string; compatibleVehicleType?: string };
    const partName = adExt.partName || "";
    const compatibleVehicleLabel = vehicleTypeLabels[adExt.compatibleVehicleType || ""] || adExt.compatibleVehicleType || "";
    const forParts = [ad.brand, ad.model, compatibleVehicleLabel].filter(Boolean).join(" ");
    return forParts ? `${partName} for ${forParts}` : (partName || ad.title || "Auto Part");
  }
  return [ad.brand, ad.model, ad.manufacturedYear, vehicleTypeLabels[ad.type] || ad.type]
    .filter(Boolean)
    .join(' ') || ad.title || "Untitled Ad";
};

const BOOST_TYPE_IMAGES: Record<string, string> = {
  BUMP:     "/assets/promotionLogos/bumpAd.png",
  TOP_AD:   "/assets/promotionLogos/topAd.png",
  URGENT:   "/assets/promotionLogos/urgentAd.jpg",
  FEATURED: "/assets/promotionLogos/featuredAd.png",
};

const BOOST_TYPE_LABELS: Record<string, string> = {
  BUMP:     "Bump Up",
  TOP_AD:   "Top Ad",
  URGENT:   "Urgent",
  FEATURED: "Featured",
};

function TitleCell({ ad }: { ad: AdType }) {
  const displayTitle = generateAdTitle(ad);
  const [showBoostDialog, setShowBoostDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const hasBoostRequest = ad.boostStatus === "PENDING" || ad.boostStatus === "ACTIVE";
  const boostTypes: string[] = (ad.boostTypes as string[]) ?? [];
  const firstImage = (ad as any).media?.[0]?.media?.url || (ad as any).media?.[0]?.url;

  return (
    <div className="flex items-center gap-2.5 py-1">
      {/* Thumbnail */}
      <Link
        href={`/dashboard/ads/${ad.id}`}
        className="shrink-0 w-11 h-8 rounded border bg-slate-100 dark:bg-slate-800 overflow-hidden relative group block"
      >
        {firstImage ? (
          <img
            src={firstImage}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/ads/${ad.id}`}
            className="hover:underline font-semibold text-xs text-foreground truncate max-w-[200px]"
            title={displayTitle}
          >
            {displayTitle}
          </Link>
          {hasBoostRequest ? (
            <button
              onClick={() => setShowBoostDialog(true)}
              title="View / Approve Boost"
              className="text-amber-500 hover:text-amber-600 transition-colors shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            </button>
          ) : (
            <button
              onClick={() => setShowPromoteDialog(true)}
              title="Promote Ad"
              className="text-slate-300 hover:text-amber-500 transition-colors shrink-0"
            >
              <Sparkles className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {ad.type && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded font-normal">
              {vehicleTypeLabels[ad.type] || ad.type}
            </span>
          )}
          {ad.boostStatus === "PENDING" && (
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[9px] px-1 py-0 font-medium">
              Boost Pending
            </Badge>
          )}
          {ad.boostStatus === "ACTIVE" && (
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] px-1 py-0 font-medium">
              Boost Active
            </Badge>
          )}
          {boostTypes.map((type) => (
            <TooltipProvider key={type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    src={BOOST_TYPE_IMAGES[type]}
                    alt={BOOST_TYPE_LABELS[type] ?? type}
                    width={16}
                    height={12}
                    className="h-3 w-auto object-contain rounded"
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white text-[10px]">
                  {BOOST_TYPE_LABELS[type] ?? type}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {showBoostDialog && <BoostApproveDialog adId={ad.id} open={showBoostDialog} onOpenChange={setShowBoostDialog} />}
      {showPromoteDialog && <AdminPromoteDialog adId={ad.id} open={showPromoteDialog} onOpenChange={setShowPromoteDialog} />}
    </div>
  );
}

export const adminColumns: ColumnDef<AdType>[] = [
  {
    id: "select",
    size: 40,
    meta: {
      headerClassName: "sticky left-0 bg-muted/95 backdrop-blur z-40 w-[40px] px-2 text-center",
      cellClassName: "sticky left-0 bg-background group-hover:bg-muted/60 group-data-[state=selected]:bg-muted z-20 w-[40px] px-2 text-center",
    },
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
    size: 260,
    meta: {
      headerClassName: "sticky left-[40px] bg-muted/95 backdrop-blur z-40 border-r border-border/50 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[240px]",
      cellClassName: "sticky left-[40px] bg-background group-hover:bg-muted/60 group-data-[state=selected]:bg-muted z-20 border-r border-border/50 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[240px]",
    },
    cell: ({ row }) => <TitleCell ad={row.original} />,
  },
  {
    accessorKey: "price",
    header: "Price",
    size: 130,
    cell: ({ row }) => {
      const ad = row.original;
      const price = ad.price;
      const isNegotiable = (ad.metadata as any)?.isNegotiable;

      return (
        <div className="flex flex-col text-xs">
          {price && price > 0 ? (
            <span className="font-bold text-teal-800 dark:text-teal-400">
              Rs. {price.toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground italic">Price on request</span>
          )}
          {isNegotiable && (
            <span className="text-[10px] text-muted-foreground font-medium">
              Negotiable
            </span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 130,
    cell: ({ row }) => {
      const ad = row.original;
      const status = ad.status;
      const rejectionDescription = ad.rejectionDescription;
      const [showDetails, setShowDetails] = useState(false);

      return (
        <>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDetails(true)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="View Ad Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {getStatusBadge(status)}
            {status === "REJECTED" && rejectionDescription && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FaInfoCircle className="w-3.5 h-3.5 text-rose-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-slate-900 text-white text-xs p-2">
                    <p className="font-semibold text-rose-300 mb-0.5">Rejection Reason:</p>
                    <p>{rejectionDescription}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <AdDetailsModal ad={ad} open={showDetails} onOpenChange={setShowDetails} />
        </>
      );
    }
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    size: 150,
    cell: ({ row }) => {
      const ad = row.original;
      const creator = ad.creator;
      const formName = ad.name;

      return (
        <div className="flex flex-col text-xs leading-tight">
          <span className="font-medium text-foreground truncate max-w-[140px]" title={creator?.name || creator?.email || "Unknown"}>
            {creator?.name || creator?.email || "Unknown"}
          </span>
          <span className="text-muted-foreground text-[10px] truncate max-w-[140px]">
            {formName ? `Seller: ${formName}` : (creator?.email || "—")}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: "phoneNumber",
    header: "Contact",
    size: 140,
    cell: ({ row }) => {
      const ad = row.original;
      const phone = ad.phoneNumber;
      const whatsapp = ad.whatsappNumber;

      return (
        <div className="flex flex-col gap-0.5 text-xs">
          {phone ? (
            <a href={`tel:${phone}`} className="text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1.5 font-medium">
              <FaMobileAlt className="w-3 h-3 shrink-0" />
              <span>{phone}</span>
            </a>
          ) : null}
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline inline-flex items-center gap-1.5 text-[11px]"
            >
              <FaWhatsapp className="w-3 h-3 shrink-0" />
              <span>{whatsapp}</span>
            </a>
          ) : null}
          {!phone && !whatsapp && <span className="text-muted-foreground text-xs">—</span>}
        </div>
      );
    }
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    size: 100,
    cell: ({ row }) => {
      const ad = row.original;
      const formattedDate = new Date(ad.createdAt).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-help whitespace-nowrap">
                {getRelativeTime(ad.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs bg-slate-900 text-white">
              {formattedDate}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  },
  {
    id: "actions",
    header: "Actions",
    size: 160,
    meta: {
      headerClassName: "sticky right-0 bg-muted/95 backdrop-blur z-40 border-l border-border/50 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] w-[160px] text-center",
      cellClassName: "sticky right-0 bg-background group-hover:bg-muted/60 group-data-[state=selected]:bg-muted z-20 border-l border-border/50 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] w-[160px] text-center",
    },
    cell: ({ row }) => {
      return <AdminActionsCell ad={row.original} />;
    }
  }
];

// Separate component to use hooks properly
function AdminActionsCell({ ad }: { ad: AdType }) {
  const router = useRouter();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [rejectionDescription, setRejectionDescription] = useState("");
  const [deleteReason, setDeleteReason] = useState<DeleteAdReason>(DELETE_AD_REASONS[0]);

  const approveMutation = useApproveAd();
  const rejectMutation = useRejectAd();
  const deleteMutation = useDeleteAd();

  // Show approve button for DRAFT, PENDING_REVIEW, and REJECTED statuses
  const canApprove = ad.status === "DRAFT" || ad.status === "PENDING_REVIEW" || ad.status === "REJECTED";
  // Show reject button for DRAFT, PENDING_REVIEW, and ACTIVE statuses
  const canReject = ad.status === "DRAFT" || ad.status === "PENDING_REVIEW" || ad.status === "ACTIVE";

  const handleReject = () => {
    rejectMutation.mutate(
      { id: ad.id, rejectionDescription: rejectionDescription.trim() || undefined },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          setRejectionDescription("");
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: ad.id, reason: deleteReason, adTitle: ad.title },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
        },
      }
    );
  };

  const isLoading = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {canApprove && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={() => approveMutation.mutate(ad.id)}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 w-7 rounded-md p-0 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-slate-900 text-white">
                Approve Ad & Notify Seller
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {canReject && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isLoading}
                  className="bg-rose-500 hover:bg-rose-600 text-white h-7 w-7 rounded-md p-0 shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-slate-900 text-white">
                Reject Ad with Reason
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Quick Edit Modal */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={() => setShowQuickEditModal(true)}
                disabled={isLoading}
                variant="outline"
                className="border-teal-600 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950 h-7 w-7 rounded-md p-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs bg-slate-900 text-white">
              Quick Edit Details
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Full Edit Navigation */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={() => router.push(`/dashboard/ads/${ad.id}`)}
                disabled={isLoading}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 h-7 w-7 rounded-md p-0"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs bg-slate-900 text-white">
              Open Full Edit Form
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Delete */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-7 w-7 rounded-md p-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs bg-slate-900 text-white">
              Delete Ad
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Quick Edit Dialog */}
      {showQuickEditModal && (
        <QuickEditAdModal
          ad={ad}
          open={showQuickEditModal}
          onOpenChange={setShowQuickEditModal}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Ad</DialogTitle>
            <DialogDescription className="text-xs">
              Please specify a reason for rejecting this ad. An email notice will be sent to the seller automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rejection-description" className="text-xs font-semibold">
                Reason Presets
              </Label>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  "Duplicate Ad",
                  "Invalid Details",
                  "Incomplete Information",
                  "Incorrect Price",
                  "Inappropriate Images",
                  "Fake / Suspicious Ad",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionDescription(reason)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium",
                      rejectionDescription === reason
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/70 hover:text-foreground"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <Textarea
                id="rejection-description"
                placeholder="Select a preset above or type a custom reason..."
                value={rejectionDescription}
                onChange={(e) => setRejectionDescription(e.target.value)}
                rows={3}
                className="resize-none text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionDescription("");
              }}
              disabled={rejectMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {rejectMutation.isPending ? "Rejecting & Notifying..." : "Reject Ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-medium text-slate-700">Reason for deletion</Label>
            <Select value={deleteReason} onValueChange={(value) => setDeleteReason(value as DeleteAdReason)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {DELETE_AD_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason} className="text-xs">
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={deleteMutation.isPending} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Ad Details Modal Component
function AdDetailsModal({ ad, open, onOpenChange }: { ad: AdType; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = (ad as any).media || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1));
  };

  const currentImage = images[currentImageIndex]?.media?.url || images[currentImageIndex]?.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Ad Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Slider */}
          {images.length > 0 ? (
            <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden aspect-video">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 h-8 w-8 rounded-full"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 h-8 w-8 rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">
              No images available
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground block">Make / Brand</span>
              <p className="text-foreground">{ad.brand || "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Model</span>
              <p className="text-foreground">{ad.model || "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Year</span>
              <p className="text-foreground">{ad.manufacturedYear || "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Type</span>
              <p className="text-foreground">{vehicleTypeLabels[ad.type] || ad.type || "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Condition</span>
              <p className="text-foreground capitalize">{ad.condition || "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Mileage</span>
              <p className="text-foreground">{ad.mileage ? `${ad.mileage.toLocaleString()} km` : "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Price</span>
              <p className="font-bold text-teal-700 dark:text-teal-400">
                {ad.price ? `Rs. ${ad.price.toLocaleString()}` : "Price on request"}
              </p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block">Location</span>
              <p className="text-foreground">{[ad.city, ad.district].filter(Boolean).join(", ") || ad.location || "—"}</p>
            </div>
          </div>

          {/* Seller Information */}
          <div className="border-t pt-3 text-xs">
            <span className="font-semibold text-muted-foreground block mb-1.5">Seller Information</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground block text-[11px]">Name</span>
                <p>{ad.creator?.name || ad.name || "Unknown"}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email</span>
                <p className="break-all">{ad.creator?.email || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Phone</span>
                <p>{ad.phoneNumber || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">WhatsApp</span>
                <p>{ad.whatsappNumber || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
