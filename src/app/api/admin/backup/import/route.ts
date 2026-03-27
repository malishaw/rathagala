/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// Insert order: root tables first, dependent tables last
const INSERT_ORDER = [
  "Province",
  "District",
  "City",
  "ManufactureYear",
  "BrandCarousel",
  "VehicleModel",
  "VehicleGrade",
  "AutoPartCategory",
  "Category",
  "Tag",
  "Newsletter",
  "BoostPricing",
  "Media",
  "Organization",
  "Member",
  "OrganizationFollower",
  "Invitation",
  "Tasks",
  "GeoHeatmap",
  "Ad",
  "AdMedia",
  "AdAnalytics",
  "AdRevision",
  "BoostRequest",
  "RevenueRecord",
  "Payment",
  "Favorite",
  "SavedSearch",
  "Report",
  "ShareEvent",
  "Message",
  "UserNotification",
  "AuditLog",
];

async function insertCollection(name: string, records: any[]): Promise<number> {
  if (!records || records.length === 0) return 0;

  const modelMap: Record<string, (data: any[]) => Promise<any>> = {
    Province: (d) => prisma.province.createMany({ data: d }),
    District: (d) => prisma.district.createMany({ data: d }),
    City: (d) => prisma.city.createMany({ data: d }),
    ManufactureYear: (d) => prisma.manufactureYear.createMany({ data: d }),
    BrandCarousel: (d) => prisma.brandCarousel.createMany({ data: d }),
    VehicleModel: (d) => prisma.vehicleModel.createMany({ data: d }),
    VehicleGrade: (d) => prisma.vehicleGrade.createMany({ data: d }),
    AutoPartCategory: (d) => prisma.autoPartCategory.createMany({ data: d }),
    Category: (d) => prisma.category.createMany({ data: d }),
    Tag: (d) => prisma.tag.createMany({ data: d }),
    Newsletter: (d) => prisma.newsletter.createMany({ data: d }),
    BoostPricing: (d) => prisma.boostPricing.createMany({ data: d }),
    Media: (d) => prisma.media.createMany({ data: d }),
    Organization: (d) => prisma.organization.createMany({ data: d }),
    Member: (d) => prisma.member.createMany({ data: d }),
    OrganizationFollower: (d) => prisma.organizationFollower.createMany({ data: d }),
    Invitation: (d) => prisma.invitation.createMany({ data: d }),
    Tasks: (d) => prisma.tasks.createMany({ data: d }),
    GeoHeatmap: (d) => prisma.geoHeatmap.createMany({ data: d }),
    Ad: (d) => prisma.ad.createMany({ data: d }),
    AdMedia: (d) => prisma.adMedia.createMany({ data: d }),
    AdAnalytics: (d) => prisma.adAnalytics.createMany({ data: d }),
    AdRevision: (d) => prisma.adRevision.createMany({ data: d }),
    BoostRequest: (d) => prisma.boostRequest.createMany({ data: d }),
    RevenueRecord: (d) => prisma.revenueRecord.createMany({ data: d }),
    Payment: (d) => prisma.payment.createMany({ data: d }),
    Favorite: (d) => prisma.favorite.createMany({ data: d }),
    SavedSearch: (d) => prisma.savedSearch.createMany({ data: d }),
    Report: (d) => prisma.report.createMany({ data: d }),
    ShareEvent: (d) => prisma.shareEvent.createMany({ data: d }),
    Message: (d) => prisma.message.createMany({ data: d }),
    UserNotification: (d) => prisma.userNotification.createMany({ data: d }),
    AuditLog: (d) => prisma.auditLog.createMany({ data: d }),
  };

  const fn = modelMap[name];
  if (!fn) return 0;
  await fn(records);
  return records.length;
}

async function clearDatabase() {
  await prisma.$transaction(
    [
      prisma.adMedia.deleteMany({}),
      prisma.adAnalytics.deleteMany({}),
      prisma.adRevision.deleteMany({}),
      prisma.boostRequest.deleteMany({}),
      prisma.favorite.deleteMany({}),
      prisma.savedSearch.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.report.deleteMany({}),
      prisma.shareEvent.deleteMany({}),
      prisma.message.deleteMany({}),
      prisma.userNotification.deleteMany({}),
      prisma.auditLog.deleteMany({}),
      prisma.geoHeatmap.deleteMany({}),
      prisma.tasks.deleteMany({}),
      prisma.revenueRecord.deleteMany({}),
      prisma.ad.deleteMany({}),
      prisma.member.deleteMany({}),
      prisma.organizationFollower.deleteMany({}),
      prisma.invitation.deleteMany({}),
      prisma.organization.deleteMany({}),
      prisma.brandCarousel.deleteMany({}),
      prisma.vehicleGrade.deleteMany({}),
      prisma.vehicleModel.deleteMany({}),
      prisma.category.deleteMany({}),
      prisma.tag.deleteMany({}),
      prisma.autoPartCategory.deleteMany({}),
      prisma.media.deleteMany({}),
      prisma.city.deleteMany({}),
      prisma.district.deleteMany({}),
      prisma.province.deleteMany({}),
      prisma.manufactureYear.deleteMany({}),
      prisma.newsletter.deleteMany({}),
      prisma.boostPricing.deleteMany({}),
    ],
    { timeout: 60000 }
  );
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    let backup: any;
    try {
      backup = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }

    if (!backup.version || !backup.collections || typeof backup.collections !== "object") {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    // Clear the database first
    await clearDatabase();

    // Insert collections in dependency order
    const counts: Record<string, number> = {};
    for (const modelName of INSERT_ORDER) {
      const records = backup.collections[modelName];
      if (records && Array.isArray(records)) {
        counts[modelName] = await insertCollection(modelName, records);
      }
    }

    return NextResponse.json({ success: true, counts });
  } catch (err) {
    console.error("Database import error:", err);
    return NextResponse.json({ error: "Failed to import database" }, { status: 500 });
  }
}
