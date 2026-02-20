"use client";

import React, { useState } from "react";
import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { adminColumns } from "@/features/ads/components/ad-table/admin-columns";
import { DataTable } from "@/components/table/data-table";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import DataTableError from "@/components/table/data-table-error";
import { DataTableSearch } from "@/components/table/data-table-search";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { useBulkApproveAds } from "@/features/ads/api/use-bulk-approve-ads";
import { useBulkDeleteAds } from "@/features/ads/api/use-bulk-delete-ads";
import { Check, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import type { AdType } from "@/features/ads/components/ad-table/admin-columns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import * as XLSX from "xlsx";
import { client } from "@/lib/rpc";
import { DELETE_AD_REASONS, type DeleteAdReason } from "@/constants/delete-reasons";
import { Label } from "@/components/ui/label";

// Vehicle type labels for title generation
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

export default function AdsManagePage() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [limit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(10)
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all")
  );

  const { data, error, isPending } = useGetAds({
    limit: limit || 10,
    page: page || 1,
    search: searchQuery || "",
    status: statusFilter && statusFilter !== "all" ? statusFilter : null,
  });

  const [selectedRows, setSelectedRows] = useState<AdType[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState<DeleteAdReason>(DELETE_AD_REASONS[0]);
  const bulkApproveMutation = useBulkApproveAds();
  const bulkDeleteMutation = useBulkDeleteAds();

  // Handle Excel Export
  const handleExportExcel = async () => {
    try {
      toast.info("Generating Excel report...", { description: "Fetching all ads..." });

      const response = await client.api.ad.$get({
        query: {
          page: "1",
          limit: "10000", // Fetch large number to get all
          search: searchQuery || "",
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ads data");
      }

      const reportData = await response.json();

      if (!reportData.ads || reportData.ads.length === 0) {
        toast.warning("No data to export");
        return;
      }

      // Format data for Excel
      const excelData = reportData.ads.map((ad: AdType) => ({
        "Title": ad.title,
        "Type": vehicleTypeLabels[ad.type] || ad.type,
        "Brand": ad.brand,
        "Model": ad.model,
        "Year": ad.manufacturedYear,
        "Price": ad.price,
        "Status": ad.status,
        "Seller": ad.user?.name || "Unknown",
        "Phone": ad.phoneNumber || ad.user?.phone || "-",
        "Created At": new Date(ad.createdAt).toLocaleDateString(),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns (rough approximation)
      const colWidths = [
        { wch: 30 }, // Title
        { wch: 15 }, // Type
        { wch: 15 }, // Brand
        { wch: 15 }, // Model
        { wch: 10 }, // Year
        { wch: 15 }, // Price
        { wch: 15 }, // Status
        { wch: 20 }, // Seller
        { wch: 15 }, // Phone
        { wch: 15 }, // Created
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Ads");

      // Save file
      const fileName = `ads-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Report generated successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Failed to generate report", { description: error.message });
    }
  };

  // Handle bulk approval
  const handleBulkApprove = () => {
    if (selectedRows.length === 0) return;

    // Filter to only approve ads that can be approved (not already ACTIVE)
    const adsToApprove = selectedRows.filter(
      (ad) => ad.status === "DRAFT" || ad.status === "PENDING_REVIEW" || ad.status === "REJECTED"
    );

    if (adsToApprove.length === 0) {
      alert("No ads selected that can be approved. Only DRAFT, PENDING_REVIEW, or REJECTED ads can be approved.");
      return;
    }

    const ids = adsToApprove.map((ad) => ad.id);
    bulkApproveMutation.mutate(ids, {
      onSuccess: () => {
        setSelectedRows([]); // Clear selection after successful approval
      },
    });
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((ad) => ad.id);
    bulkDeleteMutation.mutate({ ids, reason: deleteReason }, {
      onSuccess: () => {
        setSelectedRows([]); // Clear selection after successful deletion
        setShowDeleteDialog(false);
        setDeleteReason(DELETE_AD_REASONS[0]);
      },
    });
  };

  if (isPending) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="Ads Management"
            description="Manage and approve/reject ads submitted by users"
            actionComponent={<div />}
          />
          <Separator />
          <DataTableSkeleton columnCount={adminColumns.length} rowCount={4} />
        </div>
      </PageContainer>
    );
  }

  if (!data || error) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="Ads Management"
            description="Manage and approve/reject ads submitted by users"
            actionComponent={<div />}
          />
          <Separator />
          <DataTableError error={error} />
        </div>
      </PageContainer>
    );
  }

  // Transform the data to convert string dates to Date objects and ensure proper title format
  const formattedAds = data.ads.map((ad) => {
    // Generate the standardized title format
    const generatedTitle = [ad.brand, ad.model, ad.manufacturedYear, vehicleTypeLabels[ad.type] || ad.type]
      .filter(Boolean)
      .join(' ');

    return {
      ...ad,
      // Use the generated title for consistency, fallback to original title if needed
      title: generatedTitle || ad.title || "Untitled Ad",
      expiryDate: ad?.expiryDate ? new Date(ad?.expiryDate) : new Date(),
      featureExpiry: ad?.featureExpiry ? new Date(ad?.featureExpiry) : new Date(),
      boostExpiry: ad?.boostExpiry ? new Date(ad?.boostExpiry) : new Date(),
      updatedAt: new Date(ad.updatedAt)
    };
  });

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <AppPageShell
            title="Ads Management"
            description="Manage and approve/reject ads submitted by users"
            actionComponent={<div />} // Clear action component
          />
          <Button onClick={handleExportExcel} variant="outline" className="gap-2 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <DataTableSearch
              searchKey="Mobile number, User Name or Model"
              searchQuery={searchQuery || ""}
              setSearchQuery={setSearchQuery}
              setPage={setPage}
            />
            <Select value={statusFilter || "all"} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              <Button
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending || bulkDeleteMutation.isPending}
                className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Selected ({selectedRows.filter(ad => ad.status === "DRAFT" || ad.status === "PENDING_REVIEW" || ad.status === "REJECTED").length})
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={bulkApproveMutation.isPending || bulkDeleteMutation.isPending}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        <DataTable
          columns={adminColumns}
          data={formattedAds}
          totalItems={data.pagination.total}
          enableRowSelection={true}
          onRowSelectionChange={setSelectedRows}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedRows.length} ad(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-sm font-medium text-slate-700">Reason for deletion</Label>
            <Select value={deleteReason} onValueChange={(value) => setDeleteReason(value as DeleteAdReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {DELETE_AD_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

