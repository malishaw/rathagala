"use client";

import React, { useState } from "react";
import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/table/data-table";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import DataTableError from "@/components/table/data-table-error";
import { DataTableSearch } from "@/components/table/data-table-search";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { client } from "@/lib/rpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createDeletedAdColumns, type DeletedAdType } from "@/features/ads/components/ad-table/deleted-admin-columns";

export default function DeletedAdsPage() {
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

  const queryClient = useQueryClient();
  const [selectedRows, setSelectedRows] = useState<DeletedAdType[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch user-deleted ads
  const { data, error, isPending } = useQuery({
    queryKey: ["deleted-ads", page, limit, searchQuery],
    queryFn: async () => {
      // Fetch all ads (large limit to get all records)
      const response = await client.api.ad.$get({
        query: {
          page: "1",
          limit: "10000", // Fetch all ads
          search: searchQuery || "",
          includeDeleted: "true", // Include soft-deleted ads for this view
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ads");
      }

      const result = await response.json();
      
      // Filter for user-deleted ads only
      const allDeletedAds = result.ads.filter((ad: Record<string, unknown>) => {
        const metadata = (ad.metadata as Record<string, unknown>) || {};
        return metadata.deletedByUser === true;
      });

      // Apply pagination client-side
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAds = allDeletedAds.slice(startIndex, endIndex);

      return {
        ads: paginatedAds,
        pagination: {
          page,
          limit,
          total: allDeletedAds.length,
          totalPages: Math.ceil(allDeletedAds.length / limit),
        }
      };
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.ad[":id"].permanent.$delete({
        param: { id },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete ad (status ${res.status})`);
      }

      return id;
    },
    onSuccess: () => {
      toast.success("Ad permanently deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["deleted-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["userAds"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to permanently delete ad");
    },
  });

  // Bulk permanent delete mutation
  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const res = await client.api.ad[":id"].permanent.$delete({
            param: { id },
          });

          if (!res.ok) {
            throw new Error(`Failed to delete ad ${id} (status ${res.status})`);
          }

          return id;
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onSuccess: (data) => {
      if (data.failed === 0) {
        toast.success(`Successfully deleted ${data.successful} ad(s) permanently`);
      } else {
        toast.warning(
          `Deleted ${data.successful} ad(s), ${data.failed} failed`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["deleted-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["userAds"] });
      setSelectedRows([]);
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to permanently delete ads");
    },
  });

  // Handle single ad permanent delete
  const handlePermanentDelete = (id: string) => {
    permanentDeleteMutation.mutate(id);
  };

  // Handle bulk permanent delete
  const handleBulkPermanentDelete = () => {
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((ad) => ad.id);
    bulkPermanentDeleteMutation.mutate(ids);
  };

  // Create columns with delete handler
  const deletedAdsColumns = createDeletedAdColumns(handlePermanentDelete);

  if (isPending) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="User Deleted Ads"
            description="Manage ads that have been deleted by users"
            actionComponent={<div />}
          />
          <Separator />
          <DataTableSkeleton columnCount={deletedAdsColumns.length} rowCount={4} />
        </div>
      </PageContainer>
    );
  }

  if (!data || error) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="User Deleted Ads"
            description="Manage ads that have been deleted by users"
            actionComponent={<div />}
          />
          <Separator />
          <DataTableError error={error} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AppPageShell
          title="User Deleted Ads"
          description="Manage ads that have been deleted by users"
          actionComponent={<div />}
        />
        <Separator />
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <DataTableSearch
              searchKey="Mobile number, User Name or Model"
              searchQuery={searchQuery || ""}
              setSearchQuery={setSearchQuery}
              setPage={setPage}
            />
          </div>
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={permanentDeleteMutation.isPending || bulkPermanentDeleteMutation.isPending}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete Selected
              </Button>
            </div>
          )}
        </div>
        {data.ads.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No deleted ads found
          </div>
        ) : (
          <DataTable
            columns={deletedAdsColumns}
            data={data.ads as DeletedAdType[]}
            totalItems={data.pagination.total}
            enableRowSelection={true}
            onRowSelectionChange={setSelectedRows}
          />
        )}
      </div>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete {selectedRows.length} Ad(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedRows.length} ad(s) and all their associated data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkPermanentDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkPermanentDeleteMutation.isPending}
            >
              {bulkPermanentDeleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
