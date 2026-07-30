"use client";

import { toast } from "sonner";

async function getXLSX() {
  if (typeof window !== "undefined") {
    // Client-side dynamic import
    return await import("xlsx");
  }
  return null;
}

export async function exportBackupToExcel(backup: any) {
  try {
    const XLSX = await getXLSX();
    if (!XLSX) return;
    const workbook = XLSX.utils.book_new();

    for (const [name, records] of Object.entries(backup.collections as Record<string, unknown[]>)) {
      const flat = records.map((row) =>
        Object.fromEntries(
          Object.entries(row as Record<string, unknown>).map(([k, v]) => {
            let cell: unknown = typeof v === "object" && v !== null ? JSON.stringify(v) : v;
            if (typeof cell === "string" && cell.length > 32000) cell = cell.slice(0, 32000) + "…";
            return [k, cell];
          })
        )
      );
      const worksheet = XLSX.utils.json_to_sheet(flat.length ? flat : [{}]);
      XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
    }

    XLSX.writeFile(workbook, `database-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel file downloaded successfully");
  } catch (e) {
    console.error("Excel export error:", e);
    toast.error(e instanceof Error ? e.message : "Failed to download Excel file");
  }
}

export async function exportAdsToExcel(reportData: any, vehicleTypeLabels: Record<string, string>) {
  try {
    const excelData = (reportData.ads as any[]).map((ad: any) => ({
      Title: ad.title,
      Type: vehicleTypeLabels[ad.type] || ad.type,
      Brand: ad.brand,
      Model: ad.model,
      Year: ad.manufacturedYear,
      Price: ad.price,
      Status: ad.status,
      Seller: ad.user?.name || "Unknown",
      Phone: ad.phoneNumber || ad.user?.phone || "-",
      "Created At": new Date(ad.createdAt).toLocaleDateString(),
    }));

    const XLSX = await getXLSX();
    if (!XLSX) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Ads Report");
    XLSX.writeFile(wb, `ads-report-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel report downloaded successfully");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Failed to export Excel report");
  }
}

export async function parseAdsExcelFile(file: File) {
  const data = await file.arrayBuffer();
  const XLSX = await getXLSX();
  if (!XLSX) return [];
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

