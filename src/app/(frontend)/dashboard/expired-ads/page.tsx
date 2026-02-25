"use client";

import React from "react";
import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/table/data-table";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import DataTableError from "@/components/table/data-table-error";
import { DataTableSearch } from "@/components/table/data-table-search";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { expiredAdColumns, type ExpiredAdType } from "@/features/ads/components/ad-table/expired-admin-columns";

// 60-day expiry threshold
const AD_EXPIRY_DAYS = 60;

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
  BICYCLE: "Bicycle",
};

export default function ExpiredAdsPage() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  // Fetch all ads and filter client-side for ads older than 60 days
  const { data, error, isPending } = useQuery({
    queryKey: ["expired-ads", page, limit, searchQuery],
    queryFn: async () => {
      const response = await client.api.ad.$get({
        query: {
          page: "1",
          limit: "10000",
          search: searchQuery || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ads");
      }

      const result = await response.json();

      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() - AD_EXPIRY_DAYS);
      const now = new Date();

      // Filter: ads older than 60 days, not soft-deleted, and no active promotion
      const expiredAds = result.ads.filter((ad: Record<string, unknown>) => {
        const createdAt = new Date(ad.createdAt as string);
        const metadata = (ad.metadata as Record<string, unknown>) || {};
        const isDeletedByUser = metadata.deletedByUser === true;
        const isActiveBoosted =
          ad.boosted && ad.boostExpiry && new Date(ad.boostExpiry as string) > now;
        const isActiveFeatured =
          ad.featured && ad.featureExpiry && new Date(ad.featureExpiry as string) > now;
        return createdAt < expiryThreshold && !isDeletedByUser && !isActiveBoosted && !isActiveFeatured;
      });

      // Apply client-side pagination
      const startIndex = ((page ?? 1) - 1) * (limit ?? 10);
      const endIndex = startIndex + (limit ?? 10);
      const paginatedAds = expiredAds.slice(startIndex, endIndex);

      return {
        ads: paginatedAds,
        pagination: {
          page: page ?? 1,
          limit: limit ?? 10,
          total: expiredAds.length,
          totalPages: Math.ceil(expiredAds.length / (limit ?? 10)),
        },
      };
    },
  });

  if (isPending) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="Expired Ads"
            description="Ads that have been live for more than 60 days"
            actionComponent={<div />}
          />
          <Separator />
          <DataTableSkeleton columnCount={expiredAdColumns.length} rowCount={4} />
        </div>
      </PageContainer>
    );
  }

  if (!data || error) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <AppPageShell
            title="Expired Ads"
            description="Ads that have been live for more than 60 days"
            actionComponent={<div />}
          />
          <Separator />
          <DataTableError error={error} />
        </div>
      </PageContainer>
    );
  }

  // Transform data – same as ads-manage
  const formattedAds: ExpiredAdType[] = data.ads.map((ad: Record<string, unknown>) => {
    const generatedTitle = [
      ad.brand,
      ad.model,
      ad.manufacturedYear,
      vehicleTypeLabels[(ad.type as string)] || ad.type,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...(ad as unknown as ExpiredAdType),
      title: generatedTitle || (ad.title as string) || "Untitled Ad",
      expiryDate: ad.expiryDate ? new Date(ad.expiryDate as string) : new Date(),
      featureExpiry: ad.featureExpiry
        ? new Date(ad.featureExpiry as string)
        : new Date(),
      boostExpiry: ad.boostExpiry
        ? new Date(ad.boostExpiry as string)
        : new Date(),
      updatedAt: new Date(ad.updatedAt as string),
    };
  });

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AppPageShell
          title="Expired Ads"
          description={`Ads older than ${AD_EXPIRY_DAYS} days (no longer visible to the public)`}
          actionComponent={<div />}
        />
        <Separator />

        <div className="flex items-center gap-4 mb-4">
          <DataTableSearch
            searchKey="Mobile number, User Name or Model"
            searchQuery={searchQuery || ""}
            setSearchQuery={setSearchQuery}
            setPage={setPage}
          />
        </div>

        <DataTable
          columns={expiredAdColumns}
          data={formattedAds}
          totalItems={data.pagination.total}
        />
      </div>
    </PageContainer>
  );
}
