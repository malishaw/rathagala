"use client"

import React from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation"; // Import router for navigation
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { FileSpreadsheet, Upload } from "lucide-react";
import { client } from "@/lib/rpc";

import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { SetupAdDialog } from "@/features/ads/components/setup-ad";

import { AdsTable as AdsListing } from "@/features/ads/components/ad-listing";
import { AdsTableActions } from "@/features/ads/components/ad-table/ads-table-actions";
import { Button } from "@/components/ui/button";

export default function AdsPage() {
  const router = useRouter(); // Use Next.js router

  const handleCreateAd = () => {
    router.push('/dashboard/ads/new');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    const loadingToast = toast.loading("Processing Excel file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("Excel file is empty", { id: loadingToast });
        return;
      }

      const mappedAds = jsonData.map((row: any) => ({
        sellerEmail: row["Seller Email"] || row["sellerEmail"],
        title: row["Title"] || row["title"],
        description: row["Description"] || row["description"],
        price: row["Price"] ? Number(row["Price"]) : undefined,
        type: (row["Type"] || row["type"] || "CAR").toUpperCase(),
        listingType: (row["Listing Type"] || row["listingType"] || "SELL").toUpperCase(),
        condition: row["Condition"] || row["condition"],
        brand: row["Brand"] || row["brand"],
        model: row["Model"] || row["model"],
        manufacturedYear: row["Year"] || row["year"],
        transmission: row["Transmission"] || undefined,
        fuelType: row["Fuel Type"] || undefined,
        location: row["Location"] || undefined,
        published: true, // Default to published for imported ads
      })).filter((ad: any) => ad.sellerEmail);

      if (mappedAds.length === 0) {
        toast.error("No valid ads found (Seller Email is required)", { id: loadingToast });
        return;
      }

      const response = await fetch("/api/ad/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ads: mappedAds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import ads");
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.count} ads`, { id: loadingToast });

      // We might need to refresh the table here. 
      // Since AdsListing uses its own query, we can't easily refetch it from here unless we share context or query client.
      // A simple window reload or router refresh might be simplest for now, or just let the user see it next time.
      // But router.refresh() maps to server components.
      // For query invalidation, we usually use queryClient.invalidateQueries.
      // But let's just stick to success message for now. 
      // To improve UX, maybe reload page?
      window.location.reload();

    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import ads",
        { id: loadingToast }
      );
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Generating Excel report...", { description: "Fetching ads..." });

      // Assuming we have a similar client route for ads
      // We need to fetch ALL ads so limit high
      const response = await client.api.ad.$get({
        query: {
          page: "1",
          limit: "10000",
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ads data");
      }

      const reportData = await response.json();

      if (!reportData.ads || reportData.ads.length === 0) {
        toast.warning("No ads to export");
        return;
      }

      const excelData = reportData.ads.map((ad: any) => ({
        "ID": ad.id,
        "Title": ad.title,
        "Price": ad.price,
        "Type": ad.type,
        "Listing Type": ad.listingType,
        "Brand": ad.brand,
        "Model": ad.model,
        "Year": ad.manufacturedYear || ad.modelYear,
        "Status": ad.status,
        "Created At": new Date(ad.createdAt).toLocaleDateString(),
        "Seller": ad.creator?.email || "N/A"
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Ads");
      const fileName = `ads-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Ads report generated");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate report");
    }
  };

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AppPageShell
          title={`Ad Listing Management`}
          description="Manage your all ads for selected agent in here"
          actionComponent={
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <Button onClick={handleImportClick} variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import Excel
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </Button>
              <Button
                onClick={handleCreateAd}
                variant="default"
              >
                Create New Ad
              </Button>
            </div>
          }
        />

        <Separator />

        <AdsTableActions />

        <AdsListing />
      </div>
    </PageContainer>
  );
}