import { db } from "@/server/db";
import { ads, boostRequests, users } from "@/server/db/schema";
import { eq, or, and, gte, lte, lt, count, desc, asc, ilike, inArray, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { formatIsoDate } from "@/server/helpers/date-utils";
import { safeWaitUntil } from "@/server/helpers/execution-context";
import type { AppRouteHandler } from "@/types/server";
import type { ListRoute, GetOneRoute, TrendingRoute } from "./ad.routes";

let lastBoostExpiryCheck = 0;
const BOOST_CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const list: AppRouteHandler<ListRoute> = async (c) => {
  try {
    const rawQuery = c.req.query() as any;
    let processedQuery = { ...rawQuery };

    if (rawQuery.filterByUser !== undefined) {
      if (typeof rawQuery.filterByUser === "string") {
        processedQuery.filterByUser = rawQuery.filterByUser.toLowerCase() === "true";
      }
    }

    const query = processedQuery;
    const page = query.page ?? "1";
    const limit = query.limit ?? "10";
    const search = query.search ?? "";
    const listingType = query.listingType ?? "";

    const session = c.get("session");
    const user = c.get("user");
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(10000, parseInt(limit))); 
    const offset = (pageNum - 1) * limitNum;

    const now = new Date();
    
    // Throttle boost expiration updates so it does not hammer DB writes on every single GET read query
    if (Date.now() - lastBoostExpiryCheck > BOOST_CHECK_INTERVAL_MS) {
      lastBoostExpiryCheck = Date.now();
      const expireBoosts = async () => {
        try {
          await db.update(ads).set({
            boostStatus: "EXPIRED" as any,
            bumpActive: false,
            topAdActive: false,
            urgentActive: false,
            featuredActive: false,
            boostTypes: [] as any,
          }).where(and(eq(ads.boostStatus, "ACTIVE" as any), lt(ads.boostEndAt, now)));

          await db.update(boostRequests).set({
            status: "EXPIRED" as any,
          }).where(and(eq(boostRequests.status, "ACTIVE" as any), lt(boostRequests.expiresAt, now)));
        } catch (err) {
          console.error("Failed to expire boosts", err);
        }
      };

      safeWaitUntil(c, expireBoosts());
    }

    const conditions = [];

    if (query.filterByUser === true) {
      if (session?.userId == null) {
        return c.json(
          { message: "Authentication required to filter by user" },
          HttpStatusCodes.UNAUTHORIZED
        );
      }
      conditions.push(eq(ads.createdBy, session.userId));
    }

    if (query.seller && query.seller.trim() !== "" && query.seller.toLowerCase() !== "all") {
      conditions.push(eq(ads.createdBy, query.seller.trim()));
    }

    if (search && search.trim() !== "") {
      const isIdSearch = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.trim());
      if (isIdSearch) {
        conditions.push(eq(ads.id, search.trim()));
      } else {
        const searchTerm = `%${search.trim()}%`;
        // Use direct SQL subquery to avoid sequential HTTP DB round-trips
        const userSubquery = db.select({ id: users.id }).from(users).where(or(ilike(users.name, searchTerm), ilike(users.email, searchTerm)));

        const textConditions = [
          ilike(ads.title, searchTerm),
          ilike(ads.description, searchTerm),
          ilike(ads.brand, searchTerm),
          ilike(ads.model, searchTerm),
          ilike(ads.phoneNumber, searchTerm),
          ilike(ads.whatsappNumber, searchTerm),
          inArray(ads.createdBy, userSubquery),
        ];

        conditions.push(or(...textConditions));
      }
    }

    if (listingType && listingType.trim() !== "" && listingType.toLowerCase() !== "all") {
      const validListingTypes = ["SELL", "WANT", "RENT", "HIRE"];
      if (!validListingTypes.includes(listingType.toUpperCase())) {
        return c.json({ message: "Invalid listing type" }, 400);
      }
      conditions.push(eq(ads.listingType, listingType.toUpperCase() as any));
    }

    const brand = typeof query.brand === "string" ? query.brand.trim() : null;
    const model = typeof query.model === "string" ? query.model.trim() : null;
    if (brand && brand.toLowerCase() !== "all") conditions.push(ilike(ads.brand, brand));
    if (model && model.toLowerCase() !== "all") conditions.push(ilike(ads.model, model));

    if (query.minPrice && !isNaN(parseInt(query.minPrice))) conditions.push(gte(ads.price, parseInt(query.minPrice)));
    if (query.maxPrice && !isNaN(parseInt(query.maxPrice))) conditions.push(lte(ads.price, parseInt(query.maxPrice)));
    if (query.condition && query.condition.toLowerCase() !== "all" && query.condition.toLowerCase() !== "any") conditions.push(ilike(ads.condition, query.condition.trim()));
    if (query.minYear && query.minYear.toLowerCase() !== "all" && query.minYear.toLowerCase() !== "any") conditions.push(or(gte(ads.manufacturedYear, query.minYear.trim()), gte(ads.modelYear, query.minYear.trim())));
    if (query.maxYear && query.maxYear.toLowerCase() !== "all" && query.maxYear.toLowerCase() !== "any") conditions.push(or(lte(ads.manufacturedYear, query.maxYear.trim()), lte(ads.modelYear, query.maxYear.trim())));
    if (query.fuelType && query.fuelType.toLowerCase() !== "all" && query.fuelType.toLowerCase() !== "any") conditions.push(eq(ads.fuelType, query.fuelType.trim().toUpperCase() as any));
    if (query.transmission && query.transmission.toLowerCase() !== "all" && query.transmission.toLowerCase() !== "any") conditions.push(eq(ads.transmission, query.transmission.trim().toUpperCase() as any));
    if (query.city && query.city.toLowerCase() !== "all" && query.city.toLowerCase() !== "any") conditions.push(ilike(ads.city, query.city.trim()));
    if (query.district && query.district.toLowerCase() !== "all" && query.district.toLowerCase() !== "any") conditions.push(ilike(ads.district, query.district.trim()));
    if (query.type && query.type.toLowerCase() !== "all" && query.type.toLowerCase() !== "any") conditions.push(eq(ads.type, query.type.trim().toUpperCase() as any));

    if (query.featuredActive === "true" || query.featuredActive === true) conditions.push(eq(ads.featuredActive, true));
    if (query.topAdActive === "true" || query.topAdActive === true) conditions.push(eq(ads.topAdActive, true));
    if (query.bumpActive === "true" || query.bumpActive === true) conditions.push(eq(ads.bumpActive, true));
    if (query.urgentActive === "true" || query.urgentActive === true) conditions.push(eq(ads.urgentActive, true));

    const isAdmin = (user as any)?.role === "admin";
    const statusQuery = query.status ?? null;

    if (isAdmin && statusQuery && statusQuery.trim() !== "" && statusQuery.toLowerCase() !== "all") {
      conditions.push(eq(ads.status, statusQuery.toUpperCase() as any));
    } else if (!isAdmin && !query.filterByUser) {
      const includeExpired = query.includeExpired === "true" || query.includeExpired === true;
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      if (includeExpired) {
        conditions.push(or(
          and(eq(ads.status, "ACTIVE" as any), eq(ads.published, true), gte(ads.createdAt, sixtyDaysAgo)),
          eq(ads.status, "EXPIRED" as any)
        ));
      } else {
        conditions.push(eq(ads.status, "ACTIVE" as any));
        conditions.push(eq(ads.published, true));
        conditions.push(or(gte(ads.createdAt, sixtyDaysAgo), eq(ads.boostStatus, "ACTIVE" as any)));
      }
    }

    // Filter soft-deleted ads in SQL rather than pulling all rows into worker memory
    const includeDeleted = query.includeDeleted === "true" || query.includeDeleted === true;
    if (!includeDeleted) {
      conditions.push(sql`coalesce((${ads.metadata}->>'deletedByUser')::boolean, false) = false`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalAdsRes, fetchedAds] = await Promise.all([
      db.select({ value: count() }).from(ads).where(whereClause),
      db.query.ads.findMany({
        where: whereClause,
        offset: offset,
        limit: limitNum,
        orderBy: (ads, { desc }) => [desc(ads.createdAt)],
        with: {
          media: {
            with: { media: true }
          },
          category: true,
          analytics: true,
          boostRequests: {
            where: eq(boostRequests.status, "PENDING" as any),
            orderBy: (boostRequests, { desc }) => [desc(boostRequests.requestedAt)],
            limit: 1,
            columns: { totalAmount: true, status: true, requestedAt: true },
          },
          user: {
            columns: { id: true, name: true, email: true, image: true },
          }
        },
      }),
    ]);

    const totalAdsCount = totalAdsRes?.[0]?.value ?? 0;
    const mappedAds = fetchedAds.map(ad => ({ ...ad, creator: ad.user }));

    const formattedAds = mappedAds.map((ad: any) => ({
      ...ad,
      price: ad.price ?? null,
      location: ad.location ?? null,
      metadata: typeof ad.metadata === "object" ? ad.metadata : null,
      tags: Array.isArray(ad.tags) ? ad.tags : [],
      boostTypes: Array.isArray(ad.boostTypes) ? ad.boostTypes : [],
      type: ad.type,
      listingType: ad.listingType ?? "SELL",
      status: ad.status,
      fuelType: ad.fuelType ?? null,
      transmission: ad.transmission ?? null,
      bodyType: ad.bodyType ?? null,
      bikeType: ad.bikeType ?? null,
      vehicleType: ad.vehicleType ?? null,
      condition: ad.condition ?? null,
      brand: ad.brand ?? null,
      model: ad.model ?? null,
      grade: ad.grade ?? null,
      trimEdition: ad.trimEdition ?? null,
      manufacturedYear: ad.manufacturedYear ?? null,
      modelYear: ad.modelYear ?? null,
      mileage: ad.mileage ?? null,
      engineCapacity: ad.engineCapacity ?? null,
      serviceType: ad.serviceType ?? null,
      partType: ad.partType ?? null,
      partName: ad.partName ?? null,
      partCategoryId: ad.partCategoryId ?? null,
      compatibleVehicleType: ad.compatibleVehicleType ?? null,
      maintenanceType: ad.maintenanceType ?? null,
      name: ad.name ?? null,
      phoneNumber: ad.phoneNumber ?? null,
      whatsappNumber: ad.whatsappNumber ?? null,
      termsAndConditions: ad.termsAndConditions ?? null,
      address: ad.address ?? null,
      province: ad.province ?? null,
      district: ad.district ?? null,
      city: ad.city ?? null,
      specialNote: ad.specialNote ?? null,
      seoTitle: ad.seoTitle ?? null,
      seoDescription: ad.seoDescription ?? null,
      seoSlug: ad.seoSlug ?? null,
      categoryId: ad.categoryId ?? null,
      published: ad.published ?? false,
      isDraft: ad.isDraft ?? true,
      boosted: ad.boosted ?? false,
      featured: ad.featured ?? false,
      bumpActive: ad.bumpActive ?? false,
      topAdActive: ad.topAdActive ?? false,
      urgentActive: ad.urgentActive ?? false,
      featuredActive: ad.featuredActive ?? false,
      createdAt: formatIsoDate(ad.createdAt) ?? new Date().toISOString(),
      updatedAt: formatIsoDate(ad.updatedAt) ?? new Date().toISOString(),
      boostExpiry: formatIsoDate(ad.boostExpiry),
      featureExpiry: formatIsoDate(ad.featureExpiry),
      expiryDate: formatIsoDate(ad.expiryDate),
      boostStartAt: formatIsoDate(ad.boostStartAt),
      boostEndAt: formatIsoDate(ad.boostEndAt),
      boostTotalAmount:
        ad.boostRequests?.[0]?.totalAmount ??
        (ad.metadata as any)?.boostTotalAmount ??
        null,
    }));

    return c.json(
      {
        ads: formattedAds,
        pagination: {
          total: totalAdsCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalAdsCount / limitNum),
        },
      },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[GET ALL ADS] Error:", error);
    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adId);
    
    let whereCondition;
    if (isUuid) {
      whereCondition = eq(ads.id, adId);
    } else {
      whereCondition = eq(ads.seoSlug, adId);
    }

    const fetchedAd = await db.query.ads.findFirst({
      where: whereCondition,
      with: {
        media: { with: { media: true }, orderBy: (adMedia, { asc }) => [asc(adMedia.order)] },
        category: true,
        user: { columns: { id: true, name: true, email: true, image: true } },
        analytics: true,
        org: { columns: { id: true, name: true, slug: true, logo: true } },
      }
    });

    if (!fetchedAd) {
      return c.json({ message: "Ad not found" }, HttpStatusCodes.NOT_FOUND);
    }

    const formattedAd = {
      ...fetchedAd,
      creator: fetchedAd.user,
      org: fetchedAd.org,
      price: fetchedAd.price ?? null,
      location: fetchedAd.location ?? null,
      metadata: typeof fetchedAd.metadata === "object" ? fetchedAd.metadata : null,
      tags: Array.isArray(fetchedAd.tags) ? fetchedAd.tags : [],
      boostTypes: Array.isArray(fetchedAd.boostTypes) ? fetchedAd.boostTypes : [],
      type: fetchedAd.type,
      listingType: fetchedAd.listingType ?? "SELL",
      status: fetchedAd.status,
      fuelType: fetchedAd.fuelType ?? null,
      transmission: fetchedAd.transmission ?? null,
      bodyType: fetchedAd.bodyType ?? null,
      bikeType: fetchedAd.bikeType ?? null,
      vehicleType: fetchedAd.vehicleType ?? null,
      condition: fetchedAd.condition ?? null,
      brand: fetchedAd.brand ?? null,
      model: fetchedAd.model ?? null,
      grade: fetchedAd.grade ?? null,
      trimEdition: fetchedAd.trimEdition ?? null,
      manufacturedYear: fetchedAd.manufacturedYear ?? null,
      modelYear: fetchedAd.modelYear ?? null,
      mileage: fetchedAd.mileage ?? null,
      engineCapacity: fetchedAd.engineCapacity ?? null,
      serviceType: fetchedAd.serviceType ?? null,
      partType: fetchedAd.partType ?? null,
      partName: fetchedAd.partName ?? null,
      partCategoryId: fetchedAd.partCategoryId ?? null,
      compatibleVehicleType: fetchedAd.compatibleVehicleType ?? null,
      maintenanceType: fetchedAd.maintenanceType ?? null,
      name: fetchedAd.name ?? null,
      phoneNumber: fetchedAd.phoneNumber ?? null,
      whatsappNumber: fetchedAd.whatsappNumber ?? null,
      termsAndConditions: fetchedAd.termsAndConditions ?? null,
      address: fetchedAd.address ?? null,
      province: fetchedAd.province ?? null,
      district: fetchedAd.district ?? null,
      city: fetchedAd.city ?? null,
      specialNote: fetchedAd.specialNote ?? null,
      seoTitle: fetchedAd.seoTitle ?? null,
      seoDescription: fetchedAd.seoDescription ?? null,
      seoSlug: fetchedAd.seoSlug ?? null,
      categoryId: fetchedAd.categoryId ?? null,
      published: fetchedAd.published ?? false,
      isDraft: fetchedAd.isDraft ?? true,
      boosted: fetchedAd.boosted ?? false,
      featured: fetchedAd.featured ?? false,
      bumpActive: fetchedAd.bumpActive ?? false,
      topAdActive: fetchedAd.topAdActive ?? false,
      urgentActive: fetchedAd.urgentActive ?? false,
      featuredActive: fetchedAd.featuredActive ?? false,
      createdAt: formatIsoDate(fetchedAd.createdAt) ?? new Date().toISOString(),
      updatedAt: formatIsoDate(fetchedAd.updatedAt) ?? new Date().toISOString(),
      boostExpiry: formatIsoDate(fetchedAd.boostExpiry),
      featureExpiry: formatIsoDate(fetchedAd.featureExpiry),
      expiryDate: formatIsoDate(fetchedAd.expiryDate),
      boostStartAt: formatIsoDate(fetchedAd.boostStartAt),
      boostEndAt: formatIsoDate(fetchedAd.boostEndAt),
    };

    if (fetchedAd.published && fetchedAd.status === "ACTIVE") {
      c.header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    }

    return c.json(formattedAd as any, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[GET AD] Error:", error);
    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const trending: AppRouteHandler<TrendingRoute> = async (c) => {
  try {
    const rawQuery = c.req.query() as any;
    const limit = rawQuery.limit ?? "10";
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const fetchedAds = await db.query.ads.findMany({
      where: and(
        eq(ads.status, "ACTIVE" as any),
        eq(ads.published, true),
        or(gte(ads.createdAt, sixtyDaysAgo), eq(ads.boostStatus, "ACTIVE" as any))
      ),
      orderBy: (ads, { desc }) => [desc(ads.createdAt)],
      limit: limitNum,
      with: {
        media: { with: { media: true }, orderBy: (adMedia, { asc }) => [asc(adMedia.order)], limit: 1 },
      }
    });

    const formattedAds = fetchedAds.map((ad: any) => ({
      ...ad,
      price: ad.price ?? null,
      location: ad.location ?? null,
      metadata: typeof ad.metadata === "object" ? ad.metadata : null,
      tags: Array.isArray(ad.tags) ? ad.tags : [],
      boostTypes: Array.isArray(ad.boostTypes) ? ad.boostTypes : [],
      type: ad.type,
      listingType: ad.listingType ?? "SELL",
      status: ad.status,
      published: ad.published ?? false,
      isDraft: ad.isDraft ?? true,
      boosted: ad.boosted ?? false,
      featured: ad.featured ?? false,
      bumpActive: ad.bumpActive ?? false,
      topAdActive: ad.topAdActive ?? false,
      urgentActive: ad.urgentActive ?? false,
      featuredActive: ad.featuredActive ?? false,
      createdAt: formatIsoDate(ad.createdAt) ?? new Date().toISOString(),
      updatedAt: formatIsoDate(ad.updatedAt) ?? new Date().toISOString(),
    }));

    return c.json(formattedAds as any, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[TRENDING ADS] Error:", error);
    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
