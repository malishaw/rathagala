import { prisma } from "@/server/prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "@/types/server";
import type {
  GetPricingRoute,
  UpdatePricingRoute,
  RequestBoostRoute,
  ApproveBoostRoute,
  GetBoostRequestsRoute,
  GetAdBoostRequestRoute,
  GetRevenueRoute,
  AdminPromoteRoute,
} from "./boost.routes";
import { BoostType } from "@prisma/client";
import { sendBoostApprovedEmail } from "@/lib/email";

const BOOST_DAYS_OPTIONS = [3, 7, 15];

// Default prices if not set in DB
const DEFAULT_PRICES: Record<BoostType, Record<number, number>> = {
  BUMP: { 3: 500, 7: 1000, 15: 1800 },
  TOP_AD: { 3: 800, 7: 1500, 15: 2500 },
  URGENT: { 3: 300, 7: 600, 15: 1000 },
  FEATURED: { 3: 1000, 7: 2000, 15: 3500 },
};

async function ensurePricingExists() {
  const existing = await prisma.boostPricing.findMany();
  if (existing.length > 0) return existing;

  // Seed defaults
  const toCreate = [];
  for (const boostType of Object.keys(DEFAULT_PRICES) as BoostType[]) {
    for (const days of BOOST_DAYS_OPTIONS) {
      toCreate.push({
        boostType,
        days,
        price: DEFAULT_PRICES[boostType][days],
      });
    }
  }
  await prisma.boostPricing.createMany({ data: toCreate });
  return prisma.boostPricing.findMany();
}

export const getPricing: AppRouteHandler<GetPricingRoute> = async (c) => {
  const pricing = await ensurePricingExists();
  const formatted = pricing.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
  return c.json(formatted, HttpStatusCodes.OK);
};

export const updatePricing: AppRouteHandler<UpdatePricingRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { prices } = await c.req.json();

  for (const { boostType, days, price } of prices) {
    await prisma.boostPricing.upsert({
      where: { boostType_days: { boostType, days } },
      update: { price },
      create: { boostType, days, price },
    });
  }

  return c.json({ message: "Pricing updated" }, HttpStatusCodes.OK);
};

export const requestBoost: AppRouteHandler<RequestBoostRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);

  const body = await c.req.json();
  const { adId, boostTypes, bumpDays, topAdDays, urgentDays, featuredDays } = body;

  // Validate max 3 boost types
  if (boostTypes.length > 3) {
    return c.json({ message: "Maximum 3 boost types allowed" }, HttpStatusCodes.BAD_REQUEST);
  }

  // Validate days are valid (3, 7, or 15)
  const validDays = [3, 7, 15];
  for (const [type, days] of [
    ["BUMP", bumpDays],
    ["TOP_AD", topAdDays],
    ["URGENT", urgentDays],
    ["FEATURED", featuredDays],
  ]) {
    if (boostTypes.includes(type) && !validDays.includes(days)) {
      return c.json({ message: `Invalid duration for ${type}` }, HttpStatusCodes.BAD_REQUEST);
    }
  }

  // Check ad ownership
  const ad = await prisma.ad.findFirst({
    where: { id: adId, createdBy: user.id },
  });
  if (!ad) return c.json({ message: "Ad not found or unauthorized" }, HttpStatusCodes.BAD_REQUEST);

  // Get pricing
  const pricing = await prisma.boostPricing.findMany({
    where: { boostType: { in: boostTypes } },
  });

  const getPrice = (type: BoostType, days: number) => {
    const found = pricing.find((p) => p.boostType === type && p.days === days);
    return found?.price ?? DEFAULT_PRICES[type]?.[days] ?? 0;
  };

  let totalAmount = 0;
  let bumpAmount: number | undefined;
  let topAdAmount: number | undefined;
  let urgentAmount: number | undefined;
  let featuredAmount: number | undefined;

  if (boostTypes.includes("BUMP") && bumpDays) {
    bumpAmount = getPrice("BUMP", bumpDays);
    totalAmount += bumpAmount;
  }
  if (boostTypes.includes("TOP_AD") && topAdDays) {
    topAdAmount = getPrice("TOP_AD", topAdDays);
    totalAmount += topAdAmount;
  }
  if (boostTypes.includes("URGENT") && urgentDays) {
    urgentAmount = getPrice("URGENT", urgentDays);
    totalAmount += urgentAmount;
  }
  if (boostTypes.includes("FEATURED") && featuredDays) {
    featuredAmount = getPrice("FEATURED", featuredDays);
    totalAmount += featuredAmount;
  }

  // Create boost request & extend ad expiry by 1 day
  const boostRequest = await prisma.boostRequest.create({
    data: {
      adId,
      userId: user.id,
      boostTypes,
      bumpDays,
      topAdDays,
      urgentDays,
      featuredDays,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
      status: "PENDING",
    },
  });

  // Extend expiry date by 1 day
  await prisma.ad.update({
    where: { id: adId },
    data: {
      boostStatus: "PENDING",
      boostRequestedAt: new Date(),
      expiryDate: ad.expiryDate
        ? new Date(ad.expiryDate.getTime() + 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 61 * 24 * 60 * 60 * 1000),
    },
  });

  return c.json(
    { message: "Boost requested successfully", boostRequestId: boostRequest.id, totalAmount },
    HttpStatusCodes.CREATED
  );
};

export const approveBoost: AppRouteHandler<ApproveBoostRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const body = await c.req.json();
  const { boostRequestId, boostTypes: overrideTypes, bumpDays, topAdDays, urgentDays, featuredDays } = body;

  const boostRequest = await prisma.boostRequest.findUnique({
    where: { id: boostRequestId },
  });
  if (!boostRequest) return c.json({ message: "Boost request not found" }, HttpStatusCodes.NOT_FOUND);

  const finalBoostTypes = overrideTypes ?? boostRequest.boostTypes;
  const finalBumpDays = bumpDays ?? boostRequest.bumpDays;
  const finalTopAdDays = topAdDays ?? boostRequest.topAdDays;
  const finalUrgentDays = urgentDays ?? boostRequest.urgentDays;
  const finalFeaturedDays = featuredDays ?? boostRequest.featuredDays;

  const now = new Date();

  // Compute latest expiry among selected boost types
  const durations = [
    finalBoostTypes.includes("BUMP") ? finalBumpDays : null,
    finalBoostTypes.includes("TOP_AD") ? finalTopAdDays : null,
    finalBoostTypes.includes("URGENT") ? finalUrgentDays : null,
    finalBoostTypes.includes("FEATURED") ? finalFeaturedDays : null,
  ].filter(Boolean) as number[];

  const maxDays = Math.max(...durations, 0);
  const boostEndAt = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  // Recalculate amounts if types/days changed
  const pricing = await prisma.boostPricing.findMany({
    where: { boostType: { in: finalBoostTypes as BoostType[] } },
  });
  const getPrice = (type: BoostType, days: number) => {
    const found = pricing.find((p) => p.boostType === type && p.days === days);
    return found?.price ?? DEFAULT_PRICES[type]?.[days] ?? 0;
  };

  let totalAmount = 0;
  let bumpAmount: number | undefined;
  let topAdAmount: number | undefined;
  let urgentAmount: number | undefined;
  let featuredAmount: number | undefined;

  if (finalBoostTypes.includes("BUMP") && finalBumpDays) {
    bumpAmount = getPrice("BUMP", finalBumpDays);
    totalAmount += bumpAmount;
  }
  if (finalBoostTypes.includes("TOP_AD") && finalTopAdDays) {
    topAdAmount = getPrice("TOP_AD", finalTopAdDays);
    totalAmount += topAdAmount;
  }
  if (finalBoostTypes.includes("URGENT") && finalUrgentDays) {
    urgentAmount = getPrice("URGENT", finalUrgentDays);
    totalAmount += urgentAmount;
  }
  if (finalBoostTypes.includes("FEATURED") && finalFeaturedDays) {
    featuredAmount = getPrice("FEATURED", finalFeaturedDays);
    totalAmount += featuredAmount;
  }

  // Update boost request
  await prisma.boostRequest.update({
    where: { id: boostRequestId },
    data: {
      status: "ACTIVE",
      boostTypes: finalBoostTypes,
      bumpDays: finalBumpDays,
      topAdDays: finalTopAdDays,
      urgentDays: finalUrgentDays,
      featuredDays: finalFeaturedDays,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
      approvedBy: user!.id,
      activatedAt: now,
      expiresAt: boostEndAt,
    },
  });

  // Update Ad boost flags
  await prisma.ad.update({
    where: { id: boostRequest.adId },
    data: {
      boostTypes: finalBoostTypes,
      bumpActive: finalBoostTypes.includes("BUMP"),
      topAdActive: finalBoostTypes.includes("TOP_AD"),
      urgentActive: finalBoostTypes.includes("URGENT"),
      featuredActive: finalBoostTypes.includes("FEATURED"),
      boostStatus: "ACTIVE",
      boostStartAt: now,
      boostEndAt,
    },
  });

  // Create revenue record
  await prisma.revenueRecord.upsert({
    where: { boostRequestId },
    update: {
      boostTypes: finalBoostTypes,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
      recordedAt: now,
    },
    create: {
      boostRequestId,
      adId: boostRequest.adId,
      userId: boostRequest.userId,
      boostTypes: finalBoostTypes,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
    },
  });

  // Send boost approval email (non-blocking)
  prisma.ad.findUnique({
    where: { id: boostRequest.adId },
    select: {
      title: true,
      creator: { select: { name: true, email: true } },
    },
  }).then((ad) => {
    if (ad?.creator?.email) {
      sendBoostApprovedEmail({
        email: ad.creator.email,
        name: ad.creator.name || "User",
        adTitle: ad.title,
        adId: boostRequest.adId,
        boostTypes: finalBoostTypes,
        boostEndAt,
      }).catch((err) => console.error("[APPROVE BOOST] Failed to send email:", err));
    }
  }).catch(() => {});

  return c.json({ message: "Boost approved successfully" }, HttpStatusCodes.OK);
};

export const adminPromote: AppRouteHandler<AdminPromoteRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const body = await c.req.json();
  const { adId, boostTypes, bumpDays, topAdDays, urgentDays, featuredDays } = body;

  const ad = await prisma.ad.findUnique({ where: { id: adId } });
  if (!ad) return c.json({ message: "Ad not found" }, HttpStatusCodes.NOT_FOUND);

  if (boostTypes.length > 3) {
    return c.json({ message: "Maximum 3 boost types allowed" }, HttpStatusCodes.BAD_REQUEST);
  }

  const pricing = await prisma.boostPricing.findMany({
    where: { boostType: { in: boostTypes as BoostType[] } },
  });
  const getPrice = (type: BoostType, days: number) => {
    const found = pricing.find((p) => p.boostType === type && p.days === days);
    return found?.price ?? DEFAULT_PRICES[type]?.[days] ?? 0;
  };

  let totalAmount = 0;
  let bumpAmount: number | undefined;
  let topAdAmount: number | undefined;
  let urgentAmount: number | undefined;
  let featuredAmount: number | undefined;

  if (boostTypes.includes("BUMP") && bumpDays) { bumpAmount = getPrice("BUMP", bumpDays); totalAmount += bumpAmount; }
  if (boostTypes.includes("TOP_AD") && topAdDays) { topAdAmount = getPrice("TOP_AD", topAdDays); totalAmount += topAdAmount; }
  if (boostTypes.includes("URGENT") && urgentDays) { urgentAmount = getPrice("URGENT", urgentDays); totalAmount += urgentAmount; }
  if (boostTypes.includes("FEATURED") && featuredDays) { featuredAmount = getPrice("FEATURED", featuredDays); totalAmount += featuredAmount; }

  const now = new Date();
  const durations = [
    boostTypes.includes("BUMP") ? bumpDays : null,
    boostTypes.includes("TOP_AD") ? topAdDays : null,
    boostTypes.includes("URGENT") ? urgentDays : null,
    boostTypes.includes("FEATURED") ? featuredDays : null,
  ].filter(Boolean) as number[];
  const maxDays = Math.max(...durations, 0);
  const boostEndAt = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  // Create boost request in ACTIVE state (admin-initiated, no payment needed)
  const boostRequest = await prisma.boostRequest.create({
    data: {
      adId,
      userId: ad.createdBy,
      boostTypes,
      bumpDays,
      topAdDays,
      urgentDays,
      featuredDays,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
      status: "ACTIVE",
      approvedBy: user!.id,
      activatedAt: now,
      expiresAt: boostEndAt,
    },
  });

  await prisma.ad.update({
    where: { id: adId },
    data: {
      boostTypes,
      bumpActive: boostTypes.includes("BUMP"),
      topAdActive: boostTypes.includes("TOP_AD"),
      urgentActive: boostTypes.includes("URGENT"),
      featuredActive: boostTypes.includes("FEATURED"),
      boostStatus: "ACTIVE",
      boostRequestedAt: now,
      boostStartAt: now,
      boostEndAt,
    },
  });

  await prisma.revenueRecord.create({
    data: {
      boostRequestId: boostRequest.id,
      adId,
      userId: ad.createdBy,
      boostTypes,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
    },
  });

  return c.json({ message: "Ad promoted successfully" }, HttpStatusCodes.OK);
};

export const getBoostRequests: AppRouteHandler<GetBoostRequestsRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { status, page = "1", limit = "20" } = c.req.query();
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (status && status !== "all") {
    where.status = status;
  }

  // Auto-expire boost requests where boostEndAt has passed
  const now = new Date();
  await prisma.ad.updateMany({
    where: {
      boostStatus: "ACTIVE",
      boostEndAt: { lt: now },
    },
    data: {
      boostStatus: "EXPIRED",
      bumpActive: false,
      topAdActive: false,
      urgentActive: false,
      featuredActive: false,
      boostTypes: [],
    },
  });
  await prisma.boostRequest.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  const [boostRequests, total] = await Promise.all([
    prisma.boostRequest.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { requestedAt: "desc" },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            manufacturedYear: true,
            type: true,
            status: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.boostRequest.count({ where }),
  ]);

  return c.json(
    {
      boostRequests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    },
    HttpStatusCodes.OK
  );
};

export const getAdBoostRequest: AppRouteHandler<GetAdBoostRequestRoute> = async (c) => {
  const session = c.get("session");
  if (!session) return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);

  const { adId } = c.req.param();

  const boostRequest = await prisma.boostRequest.findFirst({
    where: { adId },
    orderBy: { requestedAt: "desc" },
  });

  return c.json({ boostRequest }, HttpStatusCodes.OK);
};

export const getRevenue: AppRouteHandler<GetRevenueRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { filter = "all" } = c.req.query();

  let dateFilter: Date | undefined;
  const now = new Date();
  if (filter === "today") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === "7days") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filter === "30days") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const where: any = {};
  if (dateFilter) {
    where.recordedAt = { gte: dateFilter };
  }

  const records = await prisma.revenueRecord.findMany({
    where,
    orderBy: { recordedAt: "desc" },
    include: {
      boostRequest: {
        include: {
          ad: { select: { id: true, title: true, brand: true, model: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  let totalRevenue = 0;
  let bumpRevenue = 0;
  let topAdRevenue = 0;
  let urgentRevenue = 0;
  let featuredRevenue = 0;
  let bumpCount = 0;
  let topAdCount = 0;
  let urgentCount = 0;
  let featuredCount = 0;

  for (const record of records) {
    totalRevenue += record.totalAmount;
    bumpRevenue += record.bumpAmount ?? 0;
    topAdRevenue += record.topAdAmount ?? 0;
    urgentRevenue += record.urgentAmount ?? 0;
    featuredRevenue += record.featuredAmount ?? 0;
    const types = record.boostTypes as string[];
    if (types.includes("BUMP")) bumpCount++;
    if (types.includes("TOP_AD")) topAdCount++;
    if (types.includes("URGENT")) urgentCount++;
    if (types.includes("FEATURED")) featuredCount++;
  }

  const totalBoostedCount = records.length;

  // Count currently active boosted ads by type
  const [activeBumpCount, activeTopAdCount, activeUrgentCount, activeFeaturedCount] = await Promise.all([
    prisma.ad.count({ where: { bumpActive: true, status: "ACTIVE" } }),
    prisma.ad.count({ where: { topAdActive: true, status: "ACTIVE" } }),
    prisma.ad.count({ where: { urgentActive: true, status: "ACTIVE" } }),
    prisma.ad.count({ where: { featuredActive: true, status: "ACTIVE" } }),
  ]);

  return c.json(
    {
      totalRevenue, bumpRevenue, topAdRevenue, urgentRevenue, featuredRevenue,
      bumpCount, topAdCount, urgentCount, featuredCount, totalBoostedCount,
      activeBumpCount, activeTopAdCount, activeUrgentCount, activeFeaturedCount,
      records,
    },
    HttpStatusCodes.OK
  );
};
