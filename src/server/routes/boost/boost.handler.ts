import { db } from "@/server/db";
import { boostPricings, boostRequests, ads, revenueRecords, users } from "@/server/db/schema";
import { eq, inArray, and, lt, gte, lte, count } from "drizzle-orm";
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
import { sendBoostApprovedEmail } from "@/lib/email";

// Drizzle type equivalents
type BoostType = "BUMP" | "TOP_AD" | "URGENT" | "FEATURED";

const BOOST_DAYS_OPTIONS = [3, 7, 15];

// Default prices if not set in DB
const DEFAULT_PRICES: Record<BoostType, Record<number, number>> = {
  BUMP: { 3: 500, 7: 1000, 15: 1800 },
  TOP_AD: { 3: 800, 7: 1500, 15: 2500 },
  URGENT: { 3: 300, 7: 600, 15: 1000 },
  FEATURED: { 3: 1000, 7: 2000, 15: 3500 },
};

async function ensurePricingExists() {
  const existing = await db.query.boostPricings.findMany();
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
  await db.insert(boostPricings).values(toCreate);
  return db.query.boostPricings.findMany();
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
    // Drizzle Upsert using ON CONFLICT DO UPDATE
    await db.insert(boostPricings)
      .values({ boostType, days, price })
      .onConflictDoUpdate({
        target: [boostPricings.boostType, boostPricings.days],
        set: { price },
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
    if (boostTypes.includes(type) && !validDays.includes(days as number)) {
      return c.json({ message: `Invalid duration for ${type}` }, HttpStatusCodes.BAD_REQUEST);
    }
  }

  // Check ad ownership
  const ad = await db.query.ads.findFirst({
    where: and(eq(ads.id, adId), eq(ads.createdBy, user.id)),
  });
  if (!ad) return c.json({ message: "Ad not found or unauthorized" }, HttpStatusCodes.BAD_REQUEST);

  // Get pricing
  const pricing = await db.query.boostPricings.findMany({
    where: inArray(boostPricings.boostType, boostTypes as BoostType[]),
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
  const [boostRequest] = await db.insert(boostRequests).values({
    adId,
    userId: user.id,
    boostTypes: boostTypes as any,
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
  }).returning();

  // Extend expiry date by 1 day
  await db.update(ads)
    .set({
      boostStatus: "PENDING",
      boostRequestedAt: new Date(),
      expiryDate: ad.expiryDate
        ? new Date(ad.expiryDate.getTime() + 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 61 * 24 * 60 * 60 * 1000),
    })
    .where(eq(ads.id, adId));

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

  const boostRequest = await db.query.boostRequests.findFirst({
    where: eq(boostRequests.id, boostRequestId),
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
  const pricing = await db.query.boostPricings.findMany({
    where: inArray(boostPricings.boostType, finalBoostTypes as BoostType[]),
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
  await db.update(boostRequests).set({
    status: "ACTIVE",
    boostTypes: finalBoostTypes as any,
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
  }).where(eq(boostRequests.id, boostRequestId));

  // Update Ad boost flags
  await db.update(ads).set({
    boostTypes: finalBoostTypes as any,
    bumpActive: finalBoostTypes.includes("BUMP"),
    topAdActive: finalBoostTypes.includes("TOP_AD"),
    urgentActive: finalBoostTypes.includes("URGENT"),
    featuredActive: finalBoostTypes.includes("FEATURED"),
    boostStatus: "ACTIVE",
    boostStartAt: now,
    boostEndAt,
  }).where(eq(ads.id, boostRequest.adId));

  // Create revenue record (upsert based on boostRequestId)
  await db.insert(revenueRecords).values({
    boostRequestId,
    adId: boostRequest.adId,
    userId: boostRequest.userId,
    boostTypes: finalBoostTypes as any,
    totalAmount,
    bumpAmount,
    topAdAmount,
    urgentAmount,
    featuredAmount,
    recordedAt: now,
  }).onConflictDoUpdate({
    target: revenueRecords.boostRequestId,
    set: {
      boostTypes: finalBoostTypes as any,
      totalAmount,
      bumpAmount,
      topAdAmount,
      urgentAmount,
      featuredAmount,
      recordedAt: now,
    },
  });

  // Send boost approval email (non-blocking)
  db.query.ads.findFirst({
    where: eq(ads.id, boostRequest.adId),
    with: {
      user: {
        columns: { name: true, email: true },
      },
    },
  }).then((ad) => {
    if (ad?.user?.email) {
      sendBoostApprovedEmail({
        email: ad.user.email,
        name: ad.user.name || "User",
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

  const ad = await db.query.ads.findFirst({ where: eq(ads.id, adId) });
  if (!ad) return c.json({ message: "Ad not found" }, HttpStatusCodes.NOT_FOUND);

  if (boostTypes.length > 3) {
    return c.json({ message: "Maximum 3 boost types allowed" }, HttpStatusCodes.BAD_REQUEST);
  }

  const pricing = await db.query.boostPricings.findMany({
    where: inArray(boostPricings.boostType, boostTypes as BoostType[]),
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
  const [boostRequest] = await db.insert(boostRequests).values({
    adId,
    userId: ad.createdBy,
    boostTypes: boostTypes as any,
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
  }).returning();

  await db.update(ads).set({
    boostTypes: boostTypes as any,
    bumpActive: boostTypes.includes("BUMP"),
    topAdActive: boostTypes.includes("TOP_AD"),
    urgentActive: boostTypes.includes("URGENT"),
    featuredActive: boostTypes.includes("FEATURED"),
    boostStatus: "ACTIVE",
    boostRequestedAt: now,
    boostStartAt: now,
    boostEndAt,
  }).where(eq(ads.id, adId));

  await db.insert(revenueRecords).values({
    boostRequestId: boostRequest.id,
    adId,
    userId: ad.createdBy,
    boostTypes: boostTypes as any,
    totalAmount,
    bumpAmount,
    topAdAmount,
    urgentAmount,
    featuredAmount,
  });

  return c.json({ message: "Ad promoted successfully" }, HttpStatusCodes.OK);
};

export const getBoostRequests: AppRouteHandler<GetBoostRequestsRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const query = c.req.query();
  const status = query.status;
  const pageNum = parseInt(query.page || "1");
  const limitNum = parseInt(query.limit || "20");
  const skip = (pageNum - 1) * limitNum;

  // Auto-expire boost requests where boostEndAt has passed
  const now = new Date();
  await db.update(ads)
    .set({
      boostStatus: "EXPIRED",
      bumpActive: false,
      topAdActive: false,
      urgentActive: false,
      featuredActive: false,
      boostTypes: [],
    })
    .where(and(eq(ads.boostStatus, "ACTIVE"), lt(ads.boostEndAt, now)));

  await db.update(boostRequests)
    .set({ status: "EXPIRED" })
    .where(and(eq(boostRequests.status, "ACTIVE"), lt(boostRequests.expiresAt, now)));

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(boostRequests.status, status as any));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [fetchedRequests, totalRes] = await Promise.all([
    db.query.boostRequests.findMany({
      where: whereClause,
      offset: skip,
      limit: limitNum,
      orderBy: (boostRequests, { desc }) => [desc(boostRequests.requestedAt)],
      with: {
        ad: {
          columns: {
            id: true,
            title: true,
            brand: true,
            model: true,
            manufacturedYear: true,
            type: true,
            status: true,
          },
        },
        user: { columns: { id: true, name: true, email: true } },
      },
    }),
    db.select({ value: count() }).from(boostRequests).where(whereClause),
  ]);

  const total = totalRes[0].value;

  return c.json(
    {
      boostRequests: fetchedRequests as any,
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

  const boostRequest = await db.query.boostRequests.findFirst({
    where: eq(boostRequests.adId, adId),
    orderBy: (boostRequests, { desc }) => [desc(boostRequests.requestedAt)],
  });

  return c.json({ boostRequest: boostRequest as any }, HttpStatusCodes.OK);
};

export const getRevenue: AppRouteHandler<GetRevenueRoute> = async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || (user as any)?.role !== "admin") {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const query = c.req.query() as any;
  const filter = query.filter || "all";
  const startDate = query.startDate;
  const endDate = query.endDate;
  const pageNum = parseInt(query.page || "1");
  const limitNum = parseInt(query.limit || "20");
  const skip = (pageNum - 1) * limitNum;

  const conditions = [];
  const now = new Date();
  
  if (filter === "today") {
    conditions.push(gte(revenueRecords.recordedAt, new Date(now.getFullYear(), now.getMonth(), now.getDate())));
  } else if (filter === "7days") {
    conditions.push(gte(revenueRecords.recordedAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
  } else if (filter === "30days") {
    conditions.push(gte(revenueRecords.recordedAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)));
  } else if (filter === "custom") {
    if (startDate) {
      conditions.push(gte(revenueRecords.recordedAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(revenueRecords.recordedAt, end));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [recordsForStats, paginatedRecords, totalRes] = await Promise.all([
    db.query.revenueRecords.findMany({
      where: whereClause,
      columns: {
        totalAmount: true,
        bumpAmount: true,
        topAdAmount: true,
        urgentAmount: true,
        featuredAmount: true,
        boostTypes: true,
      },
    }),
    db.query.revenueRecords.findMany({
      where: whereClause,
      orderBy: (revenueRecords, { desc }) => [desc(revenueRecords.recordedAt)],
      offset: skip,
      limit: limitNum,
      with: {
        boostRequest: {
          with: {
            ad: { columns: { id: true, title: true, brand: true, model: true, status: true } },
            user: { columns: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    db.select({ value: count() }).from(revenueRecords).where(whereClause),
  ]);

  const totalRecordsCount = totalRes[0].value;

  let totalRevenue = 0;
  let bumpRevenue = 0;
  let topAdRevenue = 0;
  let urgentRevenue = 0;
  let featuredRevenue = 0;
  let bumpCount = 0;
  let topAdCount = 0;
  let urgentCount = 0;
  let featuredCount = 0;

  for (const record of recordsForStats) {
    totalRevenue += record.totalAmount;
    bumpRevenue += record.bumpAmount ?? 0;
    topAdRevenue += record.topAdAmount ?? 0;
    urgentRevenue += record.urgentAmount ?? 0;
    featuredRevenue += record.featuredAmount ?? 0;
    const types = (record.boostTypes || []) as string[];
    if (types.includes("BUMP")) bumpCount++;
    if (types.includes("TOP_AD")) topAdCount++;
    if (types.includes("URGENT")) urgentCount++;
    if (types.includes("FEATURED")) featuredCount++;
  }

  const totalBoostedCount = recordsForStats.length;

  // Count currently active boosted ads by type
  const [activeBumpRes, activeTopAdRes, activeUrgentRes, activeFeaturedRes] = await Promise.all([
    db.select({ value: count() }).from(ads).where(and(eq(ads.bumpActive, true), eq(ads.status, "ACTIVE" as any))),
    db.select({ value: count() }).from(ads).where(and(eq(ads.topAdActive, true), eq(ads.status, "ACTIVE" as any))),
    db.select({ value: count() }).from(ads).where(and(eq(ads.urgentActive, true), eq(ads.status, "ACTIVE" as any))),
    db.select({ value: count() }).from(ads).where(and(eq(ads.featuredActive, true), eq(ads.status, "ACTIVE" as any))),
  ]);

  return c.json(
    {
      totalRevenue, bumpRevenue, topAdRevenue, urgentRevenue, featuredRevenue,
      bumpCount, topAdCount, urgentCount, featuredCount, totalBoostedCount,
      activeBumpCount: activeBumpRes[0].value, 
      activeTopAdCount: activeTopAdRes[0].value, 
      activeUrgentCount: activeUrgentRes[0].value, 
      activeFeaturedCount: activeFeaturedRes[0].value,
      records: paginatedRecords as any,
      pagination: {
        total: totalRecordsCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalRecordsCount / limitNum),
      },
    },
    HttpStatusCodes.OK
  );
};
