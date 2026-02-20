"use client";

import React from "react";

import { useGetAds } from "@/features/ads/api/use-get-ads";

import { columns } from "./ad-table/columns";
import { useAdsTableFilters } from "./ad-table/use-ads-table-filters";

import { DataTable } from "@/components/table/data-table";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import DataTableError from "@/components/table/data-table-error";

// Vehicle type labels for title generation
const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car",
  VAN: "Van",
  SUV_JEEP: "SUV / Jeep",
  MOTORCYCLE: "Motorbike",
  CREW_CAB: "Crew Cab",
  PICKUP_DOUBLE_CAB: "Pickup / Double Cab",
  BUS: "Bus",
  LORRY: "Lorry",
  THREE_WHEEL: "Three Wheeler",
  OTHER: "Other",
  TRACTOR: "Tractor",
  HEAVY_DUTY: "Heavy-Duty",
  BICYCLE: "Bicycle",
  AUTO_SERVICE: "Auto Service",
  RENTAL: "Rental",
  AUTO_PARTS: "Auto Parts",
  MAINTENANCE: "Maintenance",
  BOAT: "Boat"
};

export function AdsTable() {
  const { page, limit, searchQuery, statusFilter } = useAdsTableFilters();

  const { data, error, isPending } = useGetAds({
    limit,
    page,
    search: searchQuery,
    status: statusFilter && statusFilter !== "all" ? statusFilter : null,
  });

  if (isPending) {
    return <DataTableSkeleton columnCount={columns.length} rowCount={4} />;
  }

  if (!data || error) {
    return <DataTableError error={error} />;
  }

  // Transform the data to convert string dates to Date objects and ensure proper title format
  const formattedAds = data.ads.map((ad) => {
    // Generate the standardized title format
    const typeLabel = vehicleTypeLabels[ad.type] || ad.type;
    const vehicleInfo = [ad.brand, ad.model, ad.manufacturedYear || ad.modelYear, typeLabel]
      .filter(Boolean)
      .join(' ');

    let generatedTitle = vehicleInfo;
    if (ad.listingType === 'WANT') {
      generatedTitle = `Want ${vehicleInfo}`;
    } else if (ad.listingType === 'RENT') {
      generatedTitle = `${vehicleInfo} for Rent`;
    } else if (ad.listingType === 'HIRE') {
      generatedTitle = `${vehicleInfo} for Hire`;
    }

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
    <DataTable
      columns={columns}
      data={formattedAds}
      totalItems={data.pagination.total}
    />
  );
}