import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      Organization,
      Member,
      OrganizationFollower,
      Invitation,
      Tasks,
      Province,
      District,
      City,
      ManufactureYear,
      BrandCarousel,
      VehicleModel,
      VehicleGrade,
      AutoPartCategory,
      Category,
      Tag,
      Newsletter,
      BoostPricing,
      Media,
      GeoHeatmap,
      Ad,
      AdMedia,
      AdAnalytics,
      AdRevision,
      BoostRequest,
      RevenueRecord,
      Payment,
      Favorite,
      SavedSearch,
      Report,
      ShareEvent,
      Message,
      UserNotification,
      AuditLog,
    ] = await Promise.all([
      prisma.organization.findMany(),
      prisma.member.findMany(),
      prisma.organizationFollower.findMany(),
      prisma.invitation.findMany(),
      prisma.tasks.findMany(),
      prisma.province.findMany(),
      prisma.district.findMany(),
      prisma.city.findMany(),
      prisma.manufactureYear.findMany(),
      prisma.brandCarousel.findMany(),
      prisma.vehicleModel.findMany(),
      prisma.vehicleGrade.findMany(),
      prisma.autoPartCategory.findMany(),
      prisma.category.findMany(),
      prisma.tag.findMany(),
      prisma.newsletter.findMany(),
      prisma.boostPricing.findMany(),
      prisma.media.findMany(),
      prisma.geoHeatmap.findMany(),
      prisma.ad.findMany(),
      prisma.adMedia.findMany(),
      prisma.adAnalytics.findMany(),
      prisma.adRevision.findMany(),
      prisma.boostRequest.findMany(),
      prisma.revenueRecord.findMany(),
      prisma.payment.findMany(),
      prisma.favorite.findMany(),
      prisma.savedSearch.findMany(),
      prisma.report.findMany(),
      prisma.shareEvent.findMany(),
      prisma.message.findMany(),
      prisma.userNotification.findMany(),
      prisma.auditLog.findMany(),
    ]);

    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      collections: {
        Organization,
        Member,
        OrganizationFollower,
        Invitation,
        Tasks,
        Province,
        District,
        City,
        ManufactureYear,
        BrandCarousel,
        VehicleModel,
        VehicleGrade,
        AutoPartCategory,
        Category,
        Tag,
        Newsletter,
        BoostPricing,
        Media,
        GeoHeatmap,
        Ad,
        AdMedia,
        AdAnalytics,
        AdRevision,
        BoostRequest,
        RevenueRecord,
        Payment,
        Favorite,
        SavedSearch,
        Report,
        ShareEvent,
        Message,
        UserNotification,
        AuditLog,
      },
    };

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export database" }, { status: 500 });
  }
}
