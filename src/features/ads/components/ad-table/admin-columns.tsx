"use client";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import type { Ad } from "@/types/schema-types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApproveAd } from "@/features/ads/api/use-approve-ad";
import { useRejectAd } from "@/features/ads/api/use-reject-ad";
import { Check, X } from "lucide-react";

// This type is used to define the shape of our data.
export type AdType = Omit<Ad, "createdAt"> & {
  createdAt: string;
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

// Status badge colors
const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500">Active</Badge>;
    case "PENDING_REVIEW":
      return <Badge className="bg-yellow-500">Pending</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500">Rejected</Badge>;
    case "DRAFT":
      return <Badge variant="outline">Draft</Badge>;
    case "EXPIRED":
      return <Badge variant="outline">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
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
    accessorKey: "title",
    header: "Ad Title",
    cell: ({ row }) => {
      const ad = row.original;
      const displayTitle = generateAdTitle(ad);
      
      return (
        <Link
          href={`/dashboard/ads/${ad.id}`}
          className="hover:underline font-medium"
        >
          {displayTitle}
        </Link>
      );
    }
  },
  {
    accessorKey: "type",
    header: "Ad Type",
    cell: ({ row }) => {
      const type = row.original.type;
      const displayType = vehicleTypeLabels[type] || type;
      
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">
          {displayType}
        </Badge>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return getStatusBadge(row.original.status);
    }
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const creator = row.original.creator;
      return creator?.name || creator?.email || "Unknown";
    }
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
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
  const approveMutation = useApproveAd();
  const rejectMutation = useRejectAd();
  
  // Show approve button for DRAFT, PENDING_REVIEW, and REJECTED statuses
  const canApprove = ad.status === "DRAFT" || ad.status === "PENDING_REVIEW" || ad.status === "REJECTED";
  // Show reject button for DRAFT, PENDING_REVIEW, and ACTIVE statuses
  const canReject = ad.status === "DRAFT" || ad.status === "PENDING_REVIEW" || ad.status === "ACTIVE";

  // If no actions available, show a message
  if (!canApprove && !canReject) {
    return <span className="text-muted-foreground text-sm">No actions</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <Button
          size="sm"
          variant="default"
          onClick={() => approveMutation.mutate(ad.id)}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-1" />
          Approve
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => rejectMutation.mutate(ad.id)}
          disabled={approveMutation.isPending || rejectMutation.isPending}
        >
          <X className="w-4 h-4 mr-1" />
          Reject
        </Button>
      )}
    </div>
  );
}

