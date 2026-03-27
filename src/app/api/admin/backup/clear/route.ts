import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete in leaf-to-root order to avoid orphaned references
    await prisma.$transaction(
      [
        // Leaf: records that depend on Ad
        prisma.adMedia.deleteMany({}),
        prisma.adAnalytics.deleteMany({}),
        prisma.adRevision.deleteMany({}),
        prisma.boostRequest.deleteMany({}),
        // Records that depend on Ad or User
        prisma.favorite.deleteMany({}),
        prisma.savedSearch.deleteMany({}),
        prisma.payment.deleteMany({}),
        prisma.report.deleteMany({}),
        prisma.shareEvent.deleteMany({}),
        prisma.message.deleteMany({}),
        prisma.userNotification.deleteMany({}),
        // Standalone or User-dependent
        prisma.auditLog.deleteMany({}),
        prisma.geoHeatmap.deleteMany({}),
        prisma.tasks.deleteMany({}),
        prisma.revenueRecord.deleteMany({}),
        // Core content
        prisma.ad.deleteMany({}),
        // Organization hierarchy
        prisma.member.deleteMany({}),
        prisma.organizationFollower.deleteMany({}),
        prisma.invitation.deleteMany({}),
        prisma.organization.deleteMany({}),
        // Reference data
        prisma.brandCarousel.deleteMany({}),
        prisma.vehicleGrade.deleteMany({}),
        prisma.vehicleModel.deleteMany({}),
        prisma.category.deleteMany({}),
        prisma.tag.deleteMany({}),
        prisma.autoPartCategory.deleteMany({}),
        prisma.media.deleteMany({}),
        // Location hierarchy
        prisma.city.deleteMany({}),
        prisma.district.deleteMany({}),
        prisma.province.deleteMany({}),
        // Misc
        prisma.manufactureYear.deleteMany({}),
        prisma.newsletter.deleteMany({}),
        prisma.boostPricing.deleteMany({}),
      ],
      { timeout: 60000 }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Database clear error:", err);
    return NextResponse.json({ error: "Failed to clear database" }, { status: 500 });
  }
}
