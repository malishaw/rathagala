"use client";
import Link from "next/link";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import type { Ad } from "@/types/schema-types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Check, X, Eye, Edit, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { FaMobileAlt, FaWhatsapp } from "react-icons/fa";

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

      return (
        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/ads/${ad.id}`}
            className="hover:underline font-medium text-sm"
          >
            {displayTitle}
          </Link>
          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-1 w-fit border-amber-200">
            {displayType}
          </Badge>
        </div>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const rejectionDescription = row.original.rejectionDescription;
      
      return (
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          {status === "REJECTED" && rejectionDescription && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Eye className="w-4 h-4 text-red-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-blue-100 text-gray-800 border-red-600 text-sm">
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
      const creator = row.original.creator;
      const formName = row.original.name;
      
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
      const phone = row.original.phoneNumber;
      const whatsapp = row.original.whatsappNumber;
      
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
      const date = new Date(row.original.createdAt);
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

// Separate component to use hooks properly
function AdminActionsCell({ ad }: { ad: AdType }) {
  const router = useRouter();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectionDescription, setRejectionDescription] = useState("");
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
    deleteMutation.mutate(ad.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  const handleEdit = () => {
    router.push(`/dashboard/ads/${ad.id}`);
  };

  const isLoading = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

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

