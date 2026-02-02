"use client";
import Link from "next/link";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import type { Ad } from "@/types/schema-types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useUpdatePromotion } from "@/features/ads/api/use-update-promotion";
import { Check, X, Eye, Edit, Trash2, Zap, Star, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { FaMobileAlt, FaWhatsapp } from "react-icons/fa";
import { format } from "date-fns";

// This type is used to define the shape of our data.
export type AdType = Omit<Ad, "createdAt"> & {
  createdAt: string;
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

// Status badge colors - using teal gradient theme
const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white border-0">Active</Badge>;
    case "PENDING_REVIEW":
      return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">Pending</Badge>;
    case "REJECTED":
      return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Rejected</Badge>;
    case "DRAFT":
      return <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">Draft</Badge>;
    case "EXPIRED":
      return <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">Expired</Badge>;
    default:
      return <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">{status}</Badge>;
  }
};

// Helper function to generate ad title from components
const generateAdTitle = (ad: AdType): string => {
  return [ad.brand, ad.model, ad.manufacturedYear, vehicleTypeLabels[ad.type] || ad.type]
    .filter(Boolean)
    .join(' ') || ad.title || "Untitled Ad";
};

export const adminColumns: ColumnDef<AdType>[] = [
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

      // Check if promotion is still active
      const now = new Date();
      const isBoosted = ad.boosted && ad.boostExpiry && new Date(ad.boostExpiry) > now;
      const isFeatured = ad.featured && ad.featureExpiry && new Date(ad.featureExpiry) > now;

      return (
        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/ads/${ad.id}`}
            className="hover:underline font-medium text-sm"
          >
            {displayTitle}
          </Link>
          <div className="flex gap-2 flex-wrap items-center">
            <Badge variant="outline" className="bg-slate-100 text-slate-800 border-1 w-fit border-amber-200">
              {displayType}
            </Badge>
            {isBoosted && (
              <PromotionBadge
                type="boost"
                expiry={ad.boostExpiry!}
              />
            )}
            {isFeatured && (
              <PromotionBadge
                type="featured"
                expiry={ad.featureExpiry!}
              />
            )}
            <PromotionButton ad={ad} hasPromotion={isBoosted || isFeatured} />
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const ad = row.original;
      const now = new Date();
      const status = ad.status;
      const rejectionDescription = ad.rejectionDescription;
      
      return (
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          {status === "REJECTED" && rejectionDescription && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Eye className="w-4 h-4 text-red-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-teal-700 text-white border-red-600 text-sm">
                  <p>{rejectionDescription}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }
  },
  // {
  //   accessorKey: "rejectionDescription",
  //   header: "Rejection Reason",
  //   cell: ({ row }) => {
  //     const rejectionDescription = row.original.rejectionDescription;
  //     if (!rejectionDescription) {
  //       return <span className="text-muted-foreground text-sm">—</span>;
  //     }
  //     return (
  //       <div className="max-w-xs">
  //         <p className="text-sm text-red-600 line-clamp-2" title={rejectionDescription}>
  //           {rejectionDescription}
  //         </p>
  //       </div>
  //     );
  //   }
  // },
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
      return <AdminActionsCell ad={row.original} />;
    }
  }
];

// Promotion Badge Component with Tooltip
function PromotionBadge({ type, expiry }: { type: "boost" | "featured"; expiry: string }) {
  const expiryDate = new Date(expiry);
  const now = new Date();
  const isActive = expiryDate > now;
  
  if (!isActive) return null;

  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const weeksLeft = Math.floor(daysLeft / 7);
  
  let durationText = "";
  if (weeksLeft >= 4) {
    durationText = "1 month";
  } else if (weeksLeft >= 2) {
    durationText = "2 weeks";
  } else if (weeksLeft >= 1) {
    durationText = "1 week";
  } else {
    durationText = `${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
  }

  const tooltipText = `${type === "boost" ? "Boosted" : "Featured"} until ${format(expiryDate, "PPP")} (${daysLeft} days left)`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${
              type === "boost" 
                ? "bg-blue-100 text-blue-700 border-blue-300" 
                : "bg-yellow-100 text-yellow-700 border-yellow-300"
            } cursor-help flex items-center gap-1`}
          >
            {type === "boost" ? <Zap className="w-3 h-3" /> : <Star className="w-3 h-3" />}
            {type === "boost" ? "Boosted" : "Featured"} ({durationText})
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Separate component to use hooks properly
function AdminActionsCell({ ad }: { ad: AdType }) {
  const router = useRouter();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectionDescription, setRejectionDescription] = useState("");
  
  const approveMutation = useApproveAd();
  const rejectMutation = useRejectAd();
  const deleteMutation = useDeleteAd();
  const updatePromotionMutation = useUpdatePromotion();

  // Check if promotion is still active
  const now = new Date();
  const hasActiveBoost = ad.boosted && ad.boostExpiry && new Date(ad.boostExpiry) > now;
  const hasActiveFeatured = ad.featured && ad.featureExpiry && new Date(ad.featureExpiry) > now;

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
    deleteMutation.mutate(ad.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  const handleEdit = () => {
    router.push(`/dashboard/ads/${ad.id}`);
  };

  const isLoading = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending || updatePromotionMutation.isPending;

  return (
    <>
      <div className="flex items-center gap-2">
        {canApprove && (
          <Button
            size="sm"
            onClick={() => approveMutation.mutate(ad.id)}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0 h-8"
            title="Approve Ad"
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            onClick={() => setShowRejectDialog(true)}
            disabled={isLoading}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0 h-8"
            title="Reject Ad"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleEdit}
          disabled={isLoading}
          variant="outline"
          className="border-[#024950] text-[#024950] hover:bg-[#024950] hover:text-white h-8"
          title="Edit Ad"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoading}
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-8"
          title="Delete Ad"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Ad</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this ad. This will help the seller understand why their ad was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-description">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection-description"
                placeholder="Enter the reason for rejection..."
                value={rejectionDescription}
                onChange={(e) => setRejectionDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionDescription("");
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ad? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white "
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// New PromotionButton Component - displayed next to vehicle type badge
function PromotionButton({ ad, hasPromotion }: { ad: AdType; hasPromotion: boolean }) {
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionType, setPromotionType] = useState<"boost" | "featured" | "none">("none");
  const [duration, setDuration] = useState<"1week" | "2weeks" | "1month">("1week");
  
  const updatePromotionMutation = useUpdatePromotion();

  // Check if promotion is still active
  const now = new Date();
  const hasActiveBoost = ad.boosted && ad.boostExpiry && new Date(ad.boostExpiry) > now;
  const hasActiveFeatured = ad.featured && ad.featureExpiry && new Date(ad.featureExpiry) > now;

  // Calculate current promotion details
  let currentPromotionType: "boost" | "featured" | "none" = "none";
  let currentExpiry: Date | null = null;
  let daysRemaining = 0;
  
  if (hasActiveBoost) {
    currentPromotionType = "boost";
    currentExpiry = new Date(ad.boostExpiry!);
    daysRemaining = Math.ceil((currentExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else if (hasActiveFeatured) {
    currentPromotionType = "featured";
    currentExpiry = new Date(ad.featureExpiry!);
    daysRemaining = Math.ceil((currentExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Initialize dialog state when opening
  const handleOpenDialog = () => {
    setPromotionType(currentPromotionType);
    // Try to guess the duration based on days remaining
    if (currentPromotionType !== "none" && daysRemaining > 0) {
      if (daysRemaining >= 25) {
        setDuration("1month");
      } else if (daysRemaining >= 12) {
        setDuration("2weeks");
      } else {
        setDuration("1week");
      }
    } else {
      setDuration("1week");
    }
    setShowPromotionDialog(true);
  };

  const handlePromotion = () => {
    updatePromotionMutation.mutate(
      { 
        id: ad.id, 
        promotionType, 
        duration: promotionType !== "none" ? duration : undefined 
      },
      {
        onSuccess: () => {
          setShowPromotionDialog(false);
        },
      }
    );
  };

  const handleCancelPromotion = () => {
    updatePromotionMutation.mutate(
      { 
        id: ad.id, 
        promotionType: "none", 
        duration: undefined 
      },
      {
        onSuccess: () => {
          setShowPromotionDialog(false);
        },
      }
    );
  };

  return (
    <>
      <Button
        size="sm"
        onClick={handleOpenDialog}
        disabled={updatePromotionMutation.isPending}
        variant="outline"
        className={hasPromotion 
          ? "border-amber-500 text-amber-600 hover:bg-amber-50 h-6 px-2" 
          : "border-gray-300 text-gray-900 hover:bg-gray-50 h-6 px-2"
        }
        title="Manage Promotion"
      >
        {hasActiveBoost ? (
          <Zap className="w-3 h-3 text-gray-700" />
        ) : hasActiveFeatured ? (
          <Star className="w-3 h-3 text-gray-700" />
        ) : (
          <Sparkles className="w-3 h-3 text-gray-700" />
        )}
      </Button>

      {/* Promotion Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Ad Promotion</DialogTitle>
            <DialogDescription>
              Set or remove boost/featured status for this ad. Only one promotion type can be active at a time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Current Promotion Status */}
            {currentPromotionType !== "none" && (
              <div className={`rounded-lg p-4 border-2 ${
                currentPromotionType === "boost" 
                  ? "bg-blue-50 border-blue-300" 
                  : "bg-yellow-50 border-yellow-300"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {currentPromotionType === "boost" ? (
                    <Zap className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Star className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-semibold text-sm">
                    Currently {currentPromotionType === "boost" ? "Boosted" : "Featured"}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Expires: {currentExpiry ? format(currentExpiry, "PPP") : "N/A"}</p>
                  <p className="font-medium">{daysRemaining} days remaining</p>
                </div>
              </div>
            )}

            {currentPromotionType === "none" && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">No active promotion. Select an option below to promote this ad.</p>
              </div>
            )}

            <div className="space-y-3">
              <Label>Promotion Type</Label>
              <RadioGroup value={promotionType} onValueChange={(value) => setPromotionType(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">
                    No Promotion
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boost" id="boost" />
                  <Label htmlFor="boost" className="font-normal cursor-pointer flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span>Boost Ad</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="featured" id="featured" />
                  <Label htmlFor="featured" className="font-normal cursor-pointer flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span>Featured Ad</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {promotionType !== "none" && (
              <div className="space-y-3">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={(value) => setDuration(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">
                      1 Week - Rs {promotionType === "boost" ? "1,500" : "1,000"}
                    </SelectItem>
                    <SelectItem value="2weeks">
                      2 Weeks - Rs {promotionType === "boost" ? "2,500" : "1,500"}
                    </SelectItem>
                    <SelectItem value="1month">
                      1 Month - Rs {promotionType === "boost" ? "4,000" : "2,500"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasActiveBoost && promotionType !== "boost" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                ⚠️ Current boost will be removed
              </div>
            )}
            {hasActiveFeatured && promotionType !== "featured" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                ⚠️ Current featured status will be removed
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                onClick={() => setShowPromotionDialog(false)}
                disabled={updatePromotionMutation.isPending}
                className="flex-1 bg-white hover:bg-slate-100 border-1 text-slate-700"
              >
                Cancel
              </Button>
              {currentPromotionType !== "none" && (
                <Button
                  variant="outline"
                  onClick={handleCancelPromotion}
                  disabled={updatePromotionMutation.isPending}
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-600 flex-1"
                >
                  {updatePromotionMutation.isPending ? "Removing..." : "Remove Promotion"}
                </Button>
              )}
            </div>
            <Button
              onClick={handlePromotion}
              disabled={updatePromotionMutation.isPending}
              className="bg-teal-800 text-white hover:bg-teal-700 border-0 flex-1"
            >
              {updatePromotionMutation.isPending ? "Updating..." : "Update Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

