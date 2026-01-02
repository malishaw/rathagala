// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { prisma } from "@/server/prisma/client";
// import * as HttpStatusCodes from "stoker/http-status-codes";
// import * as HttpStatusPhrases from "stoker/http-status-phrases";

// import type { AppRouteHandler } from "@/types/server";
// import {
//   ListRoute,
//   CreateRoute,
//   GetOneRoute,
//   UpdateRoute,
//   RemoveRoute,
//   ApproveRoute,
//   RejectRoute,
// } from "./ad.routes";
// import { QueryParams } from "./ad.schemas";
// import { AdStatus, AdType } from "@prisma/client";


// export const list: AppRouteHandler<ListRoute> = async (c) => {
//   try {
//     // Get raw query parameters (all come as strings from HTTP)
//     const rawQuery = c.req.query() as any;

//     // FIX: Convert string "true"/"false" to actual boolean for filterByUser
//     // This handles the Zod validation issue where boolean is expected but string is received
//     let processedQuery = { ...rawQuery };

//     if (rawQuery.filterByUser !== undefined) {
//       if (typeof rawQuery.filterByUser === "string") {
//         // Convert string "true" to boolean true, anything else to false
//         processedQuery.filterByUser =
//           rawQuery.filterByUser.toLowerCase() === "true";
//       }
//       // If it's already a boolean, keep it as is
//     }

//     // FIX: Use the processed query for validation instead of trying to modify c.req.query()
//     // The original approach of calling c.req.query({...}) doesn't actually modify the request
//     const query = processedQuery;

//     const page = query.page ?? "1";
//     const limit = query.limit ?? "10";
//     const search = query.search ?? "";
//     const listingType = query.listingType ?? "";

//     const session = c.get("session");
//     const user = c.get("user");

//     console.log("Session : ", session);
//     // Convert to numbers and validate
//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100 items
//     const offset = (pageNum - 1) * limitNum;


//     // --- Refactored filter logic: always use top-level AND array ---
//     const andFilters: any[] = [];

//     // Filter by current user if filterByUser is true
//     if (query.filterByUser === true) {
//       if (session?.userId === null) {
//         return c.json(
//           { message: "Authentication required to filter by user" },
//           HttpStatusCodes.UNAUTHORIZED
//         );
//       }
//       andFilters.push({ createdBy: session?.userId });
//     }

//     // Add search functionality if search term is provided
//     // Search by: title, description, brand, model, phone number, user name
//     if (search && search.trim() !== "") {
//       const searchConditions: any[] = [
//         { title: { contains: search, mode: "insensitive" } },
//         { description: { contains: search, mode: "insensitive" } },
//         { brand: { contains: search, mode: "insensitive" } },
//         { model: { contains: search, mode: "insensitive" } },
//         { phoneNumber: { contains: search, mode: "insensitive" } },
//         { whatsappNumber: { contains: search, mode: "insensitive" } },
//       ];

//       // Also search by creator name/email if creator relation is available
//       // Note: This requires the creator relation to be included in the query
//       searchConditions.push({
//         creator: {
//           OR: [
//             { name: { contains: search, mode: "insensitive" } },
//             { email: { contains: search, mode: "insensitive" } },
//           ],
//         },
//       });

//       andFilters.push({
//         OR: searchConditions,
//       });
//     }

//     // Add listingType filtering if provided
//     if (listingType && listingType.trim() !== "" && listingType.toLowerCase() !== "all") {
//       const listingTypeValue = listingType.toUpperCase();
//       console.log("Filtering by listingType:", listingTypeValue);
//       const validListingTypes = ["SELL", "WANT", "RENT", "HIRE"];
//       if (!validListingTypes.includes(listingTypeValue)) {
//         console.log("Invalid listingType:", listingTypeValue);
//         return c.json(
//           { message: "Invalid listing type. Must be one of: SELL, WANT, RENT, HIRE" },
//           400
//         );
//       }
//       // Simply filter by the listing type without creating nested OR
//       andFilters.push({ listingType: listingTypeValue });
//     }

//     // Filter by status: only show ACTIVE ads for public listings (unless admin is viewing or filtering by user)
//     // Admin can see all ads, regular users and unauthenticated users only see ACTIVE ads in public listings
//     // When filterByUser is true, show all user's ads regardless of status
//     const userRole = (user as any)?.role;
//     const isAdmin = userRole === "admin";

//     // If not admin and not filtering by user, only show ACTIVE ads
//     // This applies to:
//     // - Unauthenticated users (user is null/undefined, so isAdmin is false)
//     // - Authenticated non-admin users (isAdmin is false)
//     // When filterByUser is true, show all ads (user wants to see their own ads with all statuses)
//     if (!isAdmin && !query.filterByUser) {
//       andFilters.push({ status: AdStatus.ACTIVE });
//     }

//     // Compose final whereCondition
//     let whereCondition: any = {};
//     if (andFilters.length === 1) {
//       whereCondition = andFilters[0];
//     } else if (andFilters.length > 1) {
//       whereCondition = { AND: andFilters };
//     }

//     // Debug: Log the final whereCondition before count query
//     console.log("[DEBUG] whereCondition before count:", JSON.stringify(whereCondition, null, 2));

//     // Quick validation: Prisma does not allow nested AND/OR at the top level
//     if (whereCondition && typeof whereCondition === "object") {
//       const keys = Object.keys(whereCondition);
//       if (keys.length === 1 && ["AND", "OR"].includes(keys[0]) && Array.isArray(whereCondition[keys[0]])) {
//         // Check for nested AND/OR inside another AND/OR
//         const arr = whereCondition[keys[0]];
//         for (const cond of arr) {
//           if (cond && typeof cond === "object") {
//             const innerKeys = Object.keys(cond);
//             if (innerKeys.length === 1 && ["AND", "OR"].includes(innerKeys[0]) && Array.isArray(cond[innerKeys[0]])) {
//               console.error("[ERROR] Nested AND/OR detected in whereCondition. Prisma does not support this structure.");
//               return c.json(
//                 { message: "Invalid filter structure: Nested AND/OR detected. Please check filter logic." },
//                 400
//               );
//             }
//           }
//         }
//       }
//     }

//     // Count query for total number of records
//     let totalAds;
//     try {
//       totalAds = await prisma.ad.count({
//         where: whereCondition,
//       });
//       console.log("Total ads found:", totalAds);
//     } catch (countError: any) {
//       console.error("Error in count query:", countError);
//       // Temporarily return error details to help debugging locally
//       return c.json(
//         { message: "Database error while counting ads", details: countError.message || String(countError) },
//         HttpStatusCodes.INTERNAL_SERVER_ERROR
//       );
//     }

//     // Main query with pagination
//     let ads;
//     try {
//       // Fetch without nested media to avoid Prisma throwing when a required relation is missing
//       ads = await prisma.ad.findMany({
//         where: whereCondition,
//         skip: offset,
//         take: limitNum,
//         orderBy: {
//           createdAt: "desc",
//         },
//         include: {
//           media: true, // hydrate nested Media manually to tolerate orphaned AdMedia rows
//           category: true,
//           creator: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               image: true,
//             },
//           },
//           analytics: true,
//         },
//       });
//       console.log("Ads query successful, found:", ads.length, "ads");
//     } catch (queryError) {
//       console.error("Error in main query:", queryError);
//       return c.json(
//         { message: "Database error while fetching ads " +queryError},
//         HttpStatusCodes.INTERNAL_SERVER_ERROR
//       );
//     }

//     // Hydrate AdMedia.media manually and filter out orphans (AdMedia entries referencing missing Media)
//     const allAdMedia = ads.flatMap((ad: any) => ad.media || []);
//     const mediaIds = Array.from(new Set(allAdMedia.map((m: any) => m.mediaId).filter(Boolean)));
//     let mediaById: Record<string, any> = {};
//     if (mediaIds.length > 0) {
//       const medias = await prisma.media.findMany({ where: { id: { in: mediaIds } } });
//       mediaById = medias.reduce((acc: any, m: any) => {
//         acc[m.id] = m;
//         return acc;
//         }, {} as Record<string, any>);
//     }
//     ads = ads.map((ad: any) => ({
//       ...ad,
//       media: (ad.media || [])
//         .map((am: any) => ({ ...am, media: mediaById[am.mediaId] }))
//         .filter((am: any) => Boolean(am.media)),
//     }));

//     // Format the response data to ensure it matches the expected types
//     const formattedAds = ads.map((ad) => ({
//       ...ad,
//       // Ensure these fields have the correct types
//       price: ad.price ?? null,
//       location: ad.location ?? null,
//       metadata: typeof ad.metadata === "object" ? ad.metadata : null,
//       tags: ad.tags ?? [],

//       // Handle all enum types explicitly
//       type: ad.type as
//         | "CAR"
//         | "VAN"
//         | "MOTORCYCLE"
//         | "BICYCLE"
//         | "THREE_WHEEL"
//         | "BUS"
//         | "LORRY"
//         | "HEAVY_DUTY"
//         | "TRACTOR"
//         | "AUTO_SERVICE"
//         | "RENTAL"
//         | "AUTO_PARTS"
//         | "MAINTENANCE"
//         | "BOAT",
//   listingType: ((ad as any).listingType as "SELL" | "WANT" | "RENT" | "HIRE") ?? "SELL",
//       status: ad.status as
//         | "ACTIVE"
//         | "EXPIRED"
//         | "DRAFT"
//         | "PENDING_REVIEW"
//         | "REJECTED",
//       fuelType: ad.fuelType as
//         | "PETROL"
//         | "DIESEL"
//         | "HYBRID"
//         | "ELECTRIC"
//         | "GAS"
//         | null,
//       transmission: ad.transmission as "MANUAL" | "AUTOMATIC" | "CVT" | null,
//       bodyType: ad.bodyType as "SALOON" | "HATCHBACK" | "STATION_WAGON" | null,
//       bikeType: ad.bikeType as
//         | "SCOOTER"
//         | "E_BIKE"
//         | "MOTORBIKES"
//         | "QUADRICYCLES"
//         | null,
//       vehicleType: ad.vehicleType as
//         | "BED_TRAILER"
//         | "BOWSER"
//         | "BULLDOZER"
//         | "CRANE"
//         | "DUMP_TRUCK"
//         | "EXCAVATOR"
//         | "LOADER"
//         | "OTHER"
//         | null,

//       // Handle all the new dynamic fields
//       condition: ad.condition ?? null,
//       brand: ad.brand ?? null,
//       model: ad.model ?? null,
//       trimEdition: ad.trimEdition ?? null,
//       manufacturedYear: ad.manufacturedYear ?? null,
//       modelYear: ad.modelYear ?? null,
//       mileage: ad.mileage ?? null,
//       engineCapacity: ad.engineCapacity ?? null,
//       serviceType: ad.serviceType ?? null,
//       partType: ad.partType ?? null,
//       maintenanceType: ad.maintenanceType ?? null,

//       // Contact & Location fields
//       name: ad.name ?? null,
//       phoneNumber: ad.phoneNumber ?? null,
//       whatsappNumber: ad.whatsappNumber ?? null,
//       termsAndConditions: ad.termsAndConditions ?? null,
//       address: ad.address ?? null,
//       province: ad.province ?? null,
//       district: ad.district ?? null,
//       city: ad.city ?? null,
//       specialNote: ad.specialNote ?? null,

//       // SEO fields
//       seoTitle: ad.seoTitle ?? null,
//       seoDescription: ad.seoDescription ?? null,
//       seoSlug: ad.seoSlug ?? null,
//       categoryId: ad.categoryId ?? null,

//       // Status fields
//       published: ad.published ?? false,
//       isDraft: ad.isDraft ?? true,
//       boosted: ad.boosted ?? false,
//       featured: ad.featured ?? false,

//       // Convert Date objects to ISO strings
//       createdAt: ad.createdAt.toISOString(),
//       updatedAt: ad.updatedAt.toISOString(),
//       boostExpiry: ad.boostExpiry?.toISOString() ?? null,
//       featureExpiry: ad.featureExpiry?.toISOString() ?? null,
//       expiryDate: ad.expiryDate?.toISOString() ?? null,
//     }));

//     return c.json(
//       {
//         ads: formattedAds,
//         pagination: {
//           total: totalAds,
//           page: pageNum,
//           limit: limitNum,
//           totalPages: Math.ceil(totalAds / limitNum),
//         },
//       },
//       HttpStatusCodes.OK
//     );
//   } catch (error: any) {
//     console.error("[GET ALL ADS] Error:", error);

//     return c.json(
//       { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
//       HttpStatusCodes.INTERNAL_SERVER_ERROR
//     );
//   }
// };

// // ---- Create Ad Handler ----
// export const create: AppRouteHandler<CreateRoute> = async (c) => {
//   try {
//     const adDetails = c.req.valid("json");
//     const user = c.get("user");
//     const session = c.get("session");

//     if (!user) {
//       return c.json(
//         { message: HttpStatusPhrases.UNAUTHORIZED },
//         HttpStatusCodes.UNAUTHORIZED
//       ) as any;
//     }

//     // if (!session?.activeOrganizationId) {
//     //   return c.json(
//     //     { message: "Active organization is required to create an ad." },
//     //     HttpStatusCodes.UNAUTHORIZED
//     //   );
//     // }

//     // Prepare Seo slug based on title
//     let seoSlug = "";
//     if (adDetails.title) {
//       seoSlug = adDetails.title
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/^-|-$/g, "");
//     } else {
//       // Generate a slug from brand, model, and year if available
//       const slugParts = [
//         adDetails.brand,
//         adDetails.model,
//         adDetails.manufacturedYear || adDetails.modelYear,
//       ].filter(Boolean);

//       if (slugParts.length > 0) {
//         seoSlug = slugParts
//           .join(" ")
//           .toLowerCase()
//           .replace(/[^a-z0-9]+/g, "-")
//           .replace(/^-|-$/g, "");
//       } else {
//         // If no title or vehicle info, use a placeholder with timestamp
//         seoSlug = `vehicle-${Date.now()}`;
//       }
//     }

//     // Bind random suffix to seoSlug for ensure uniqueness
//     seoSlug += `-${Math.random().toString(36).substring(2, 8)}`;

//     // Determine status: if published and not draft, set to PENDING_REVIEW, otherwise DRAFT
//     const isPublished = adDetails.published || false;
//     const isDraft = adDetails.isDraft ?? true;
//     const adStatus = (!isDraft && isPublished) ? AdStatus.PENDING_REVIEW : AdStatus.DRAFT;

//     const createdAd = await prisma.ad.create({
//       data: {
//         orgId: session?.activeOrganizationId ||"",
//         createdBy: user.id,
//         title: adDetails.title || "",
//         description: adDetails.description || "",
//         type: (adDetails.type as AdType) || AdType.CAR,
//         listingType: adDetails.listingType || "SELL",
//         status: adStatus,
//         seoSlug: seoSlug,

//         // Basic Info
//         published: adDetails.published || false,
//         isDraft: adDetails.isDraft ?? true,
//         boosted: adDetails.boosted || false,
//         featured: adDetails.featured || false,

//         // SEO fields
//         seoTitle: adDetails.seoTitle || null,
//         seoDescription: adDetails.seoDescription || null,

//         // Category & Tags
//         categoryId: adDetails.categoryId || null,
//         tags: adDetails.tags || [],

//         // Pricing
//         price: adDetails.price || null,

//         // Common Vehicle Fields (used by multiple types)
//         condition: adDetails.condition || null,
//         brand: adDetails.brand || null,
//         model: adDetails.model || null,
//         trimEdition: adDetails.trimEdition || null,

//         // Year Fields (different names for different types)
//         manufacturedYear: adDetails.manufacturedYear || null, // Used by: Car, Motor Bike
//         modelYear: adDetails.modelYear || null, // Used by: Van, Three Wheeler, Bus, Lorry, Heavy Duty, Tractor

//         // Performance Fields
//         mileage: adDetails.mileage || null, // Used by: Car, Van, Motor Bike, Three Wheeler, Bus, Lorry
//         engineCapacity: adDetails.engineCapacity || null, // Used by: Car, Van, Motor Bike, Bus, Lorry

//         // Car & Van Specific Fields
//         fuelType: adDetails.fuelType || null, // Used by: Car
//         transmission: adDetails.transmission || null, // Used by: Car
//         bodyType: adDetails.bodyType || null, // Used by: Car

//         // Motor Bike Specific Fields
//         bikeType: adDetails.bikeType || null, // Used by: Motor Bike

//         // Heavy Duty Specific Fields
//         vehicleType: adDetails.vehicleType || null, // Used by: Heavy Duty

//         // Service & Parts Specific Fields
//         serviceType: adDetails.serviceType || null, // Used by: Auto Service, Rental
//         partType: adDetails.partType || null, // Used by: Auto Parts
//         maintenanceType: adDetails.maintenanceType || null, // Used by: Maintenance

//         // Contact Info
//         name: adDetails.name || null,
//         phoneNumber: adDetails.phoneNumber || null,
//         whatsappNumber: adDetails.whatsappNumber || null,
//         termsAndConditions: adDetails.termsAndConditions || null,

//         // Location Info
//         location: adDetails.location || null,
//         address: adDetails.address || null,
//         province: adDetails.province || null,
//         district: adDetails.district || null,
//         city: adDetails.city || null,

//         // Miscellaneous
//         specialNote: adDetails.specialNote || null,
//         metadata: adDetails.metadata || {},
//       },
//     });

//     // Handle media relationships if mediaIds are provided
//     if (
//       adDetails.mediaIds &&
//       Array.isArray(adDetails.mediaIds) &&
//       adDetails.mediaIds.length > 0
//     ) {
//       const mediaRelations = adDetails.mediaIds.map(
//         (mediaId: string, index: number) => ({
//           adId: createdAd.id,
//           mediaId: mediaId,
//           order: index,
//         })
//       );

//       await prisma.adMedia.createMany({
//         data: mediaRelations,
//       });
//     }

//     // Format dates for the response and ensure metadata is an object or null
//     const formattedAd = {
//       ...createdAd,
//       createdAt: createdAd.createdAt.toISOString(),
//       updatedAt: createdAd.updatedAt.toISOString(),
//       boostExpiry: createdAd.boostExpiry?.toISOString() ?? null,
//       featureExpiry: createdAd.featureExpiry?.toISOString() ?? null,
//       expiryDate: createdAd.expiryDate?.toISOString() ?? null,
//       // Ensure metadata is an object or null
//       metadata:
//         typeof createdAd.metadata === "object" ? createdAd.metadata : null,
//     };

//     return c.json(formattedAd, HttpStatusCodes.CREATED);
//   } catch (error: any) {
//     console.error("[CREATE AD] Error:", error);

//     if (error.name === "ZodError") {
//       return c.json(
//         {
//           message: "Validation error",
//           details: error.issues,
//         },
//         HttpStatusCodes.UNPROCESSABLE_ENTITY
//       );
//     }

//     return c.json(
//       { message: error.message || HttpStatusPhrases.UNPROCESSABLE_ENTITY },
//       HttpStatusCodes.UNPROCESSABLE_ENTITY
//     );
//   }
// };

// // ---- Get single Ad Handler ----
// export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
//   try {
//     const adId = c.req.valid("param").id;

//     let ad: any;
//     try {
//       // Do not include nested Media to tolerate orphaned relations; hydrate manually below
//       ad = await prisma.ad.findUnique({
//         where: { id: adId },
//         include: {
//           media: true,
//           category: true,
//           creator: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               image: true,
//             },
//           },
//           analytics: true,
//           org: {
//             select: {
//               id: true,
//               name: true,
//               slug: true,
//               logo: true,
//             },
//           },
//           favorites: {
//             select: {
//               userId: true,
//             },
//           },
//           reports: {
//             select: {
//               id: true,
//               reason: true,
//               status: true,
//             },
//           },
//           shareEvents: {
//             select: {
//               platform: true,
//               sharedAt: true,
//             },
//           },
//         },
//       });
//     } catch (findError: any) {
//       // Handle Prisma inconsistent query when a required relation is missing in DB (e.g., org)
//       const msg = String(findError?.message || "");
//       if (msg.includes("Field org is required to return data")) {
//         console.warn("[GET AD] Org relation missing for ad, retrying without org include", adId);
//         // Retry without org include to return the ad even when org is missing
//         ad = await prisma.ad.findUnique({
//           where: { id: adId },
//           include: {
//             media: true,
//             category: true,
//             creator: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 image: true,
//               },
//             },
//             analytics: true,
//             // org omitted intentionally
//             favorites: {
//               select: {
//                 userId: true,
//               },
//             },
//             reports: {
//               select: {
//                 id: true,
//                 reason: true,
//                 status: true,
//               },
//             },
//             shareEvents: {
//               select: {
//                 platform: true,
//                 sharedAt: true,
//               },
//             },
//           },
//         });
//       } else {
//         throw findError;
//       }
//     }

//     if (!ad) {
//       return c.json(
//         { message: HttpStatusPhrases.NOT_FOUND },
//         HttpStatusCodes.NOT_FOUND
//       );
//     }

//     // Manually hydrate nested Media and filter out orphaned AdMedia entries
//     const adMediaList = (ad.media || []) as Array<any>;
//     const mediaIds = Array.from(new Set(adMediaList.map((m: any) => m.mediaId).filter(Boolean)));
//     if (mediaIds.length > 0) {
//       const medias = await prisma.media.findMany({ where: { id: { in: mediaIds } } });
//       const mediaById = medias.reduce((acc: any, m: any) => {
//         acc[m.id] = m;
//         return acc;
//       }, {} as Record<string, any>);
//       ad = {
//         ...ad,
//         media: adMediaList
//           .map((am: any) => ({ ...am, media: mediaById[am.mediaId] }))
//           .filter((am: any) => Boolean(am.media)),
//       };
//     }

//     // Format dates for the response and ensure all fields have correct types
//     const formattedAd = {
//       ...ad,
//       // Ensure these fields have the correct types
//       price: ad.price ?? null,
//       location: ad.location ?? null,
//       metadata: typeof ad.metadata === "object" ? ad.metadata : null,
//       tags: ad.tags ?? [],

//       // Handle all enum types explicitly
//       type: ad.type as
//         | "CAR"
//         | "VAN"
//         | "MOTORCYCLE"
//         | "BICYCLE"
//         | "THREE_WHEEL"
//         | "BUS"
//         | "LORRY"
//         | "HEAVY_DUTY"
//         | "TRACTOR"
//         | "AUTO_SERVICE"
//         | "RENTAL"
//         | "AUTO_PARTS"
//         | "MAINTENANCE"
//         | "BOAT",
//       listingType: (ad.listingType as "SELL" | "WANT" | "RENT" | "HIRE") ?? "SELL",
//       status: ad.status as
//         | "ACTIVE"
//         | "EXPIRED"
//         | "DRAFT"
//         | "PENDING_REVIEW"
//         | "REJECTED",
//       fuelType: ad.fuelType as
//         | "PETROL"
//         | "DIESEL"
//         | "HYBRID"
//         | "ELECTRIC"
//         | "GAS"
//         | null,
//       transmission: ad.transmission as "MANUAL" | "AUTOMATIC" | "CVT" | null,
//       bodyType: ad.bodyType as "SALOON" | "HATCHBACK" | "STATION_WAGON" | null,
//       bikeType: ad.bikeType as
//         | "SCOOTER"
//         | "E_BIKE"
//         | "MOTORBIKES"
//         | "QUADRICYCLES"
//         | null,
//       vehicleType: ad.vehicleType as
//         | "BED_TRAILER"
//         | "BOWSER"
//         | "BULLDOZER"
//         | "CRANE"
//         | "DUMP_TRUCK"
//         | "EXCAVATOR"
//         | "LOADER"
//         | "OTHER"
//         | null,

//       // Handle all the new dynamic fields
//       condition: ad.condition ?? null,
//       brand: ad.brand ?? null,
//       model: ad.model ?? null,
//       trimEdition: ad.trimEdition ?? null,
//       manufacturedYear: ad.manufacturedYear ?? null,
//       modelYear: ad.modelYear ?? null,
//       mileage: ad.mileage ?? null,
//       engineCapacity: ad.engineCapacity ?? null,
//       serviceType: ad.serviceType ?? null,
//       partType: ad.partType ?? null,
//       maintenanceType: ad.maintenanceType ?? null,

//       // Contact & Location fields
//       name: ad.name ?? null,
//       phoneNumber: ad.phoneNumber ?? null,
//       whatsappNumber: ad.whatsappNumber ?? null,
//       termsAndConditions: ad.termsAndConditions ?? null,
//       address: ad.address ?? null,
//       province: ad.province ?? null,
//       district: ad.district ?? null,
//       city: ad.city ?? null,
//       specialNote: ad.specialNote ?? null,

//       // SEO fields
//       seoTitle: ad.seoTitle ?? null,
//       seoDescription: ad.seoDescription ?? null,
//       seoSlug: ad.seoSlug ?? null,
//       categoryId: ad.categoryId ?? null,

//       // Status fields
//       published: ad.published ?? false,
//       isDraft: ad.isDraft ?? true,
//       boosted: ad.boosted ?? false,
//       featured: ad.featured ?? false,

//       // Convert Date objects to ISO strings
//       createdAt: ad.createdAt.toISOString(),
//       updatedAt: ad.updatedAt.toISOString(),
//       boostExpiry: ad.boostExpiry?.toISOString() ?? null,
//       featureExpiry: ad.featureExpiry?.toISOString() ?? null,
//       expiryDate: ad.expiryDate?.toISOString() ?? null,
//     };

//     return c.json(formattedAd, HttpStatusCodes.OK);
//   } catch (error: any) {
//     console.error("[GET AD] Error:", error);

//     return c.json(
//       { message: error.message || "Invalid request" },
//       HttpStatusCodes.UNPROCESSABLE_ENTITY
//     );
//   }
// };

// // ---- Update Ad Handler ----
// export const update: AppRouteHandler<UpdateRoute> = async (c) => {
//   try {
//     const adId = c.req.valid("param").id;
//     const adUpdates = c.req.valid("json");
//     const user = c.get("user");

//     if (!user) {
//       return c.json(
//         { message: HttpStatusPhrases.UNAUTHORIZED },
//         HttpStatusCodes.UNAUTHORIZED
//       );
//     }

//     // Check if ad exists and if user has permission
//     const existingAd = await prisma.ad.findUnique({
//       where: { id: adId },
//     });

//     if (!existingAd) {
//       return c.json(
//         { message: HttpStatusPhrases.NOT_FOUND },
//         HttpStatusCodes.NOT_FOUND
//       ) as any;
//     }

//     // Verify user is the owner of the ad
//     if (existingAd.createdBy !== user.id) {
//       return c.json(
//         { message: "You don't have permission to update this ad" },
//         HttpStatusCodes.FORBIDDEN
//       ) as any;
//     }

//     // Prepare update data with all the new dynamic fields
//     const updateData: any = {
//       updatedAt: new Date(),
//     };

//     // Basic fields
//     if (adUpdates.title !== undefined) updateData.title = adUpdates.title;
//     if (adUpdates.description !== undefined)
//       updateData.description = adUpdates.description;
//     if (adUpdates.type !== undefined) updateData.type = adUpdates.type;
//     if (adUpdates.price !== undefined) updateData.price = adUpdates.price;
//     if (adUpdates.published !== undefined)
//       updateData.published = adUpdates.published;
//     if (adUpdates.isDraft !== undefined) updateData.isDraft = adUpdates.isDraft;

//     // Update status based on published and isDraft flags
//     // If ad is being published (isDraft=false and published=true), set to PENDING_REVIEW
//     const willBePublished = (adUpdates.published !== undefined ? adUpdates.published : existingAd.published) && 
//                            (adUpdates.isDraft !== undefined ? !adUpdates.isDraft : !existingAd.isDraft);
//     const willBeDraft = adUpdates.isDraft !== undefined ? adUpdates.isDraft : existingAd.isDraft;

//     if (willBePublished && !willBeDraft) {
//       // Ad is being published, set status to PENDING_REVIEW
//       updateData.status = AdStatus.PENDING_REVIEW;
//     } else if (willBeDraft) {
//       // Ad is being saved as draft, set status to DRAFT
//       updateData.status = AdStatus.DRAFT;
//     }
//     if (adUpdates.boosted !== undefined) updateData.boosted = adUpdates.boosted;
//     if (adUpdates.featured !== undefined)
//       updateData.featured = adUpdates.featured;

//     // SEO fields
//     if (adUpdates.seoTitle !== undefined)
//       updateData.seoTitle = adUpdates.seoTitle;
//     if (adUpdates.seoDescription !== undefined)
//       updateData.seoDescription = adUpdates.seoDescription;

//     // Category & Tags
//     if (adUpdates.categoryId !== undefined)
//       updateData.categoryId = adUpdates.categoryId;
//     if (adUpdates.tags !== undefined) updateData.tags = adUpdates.tags;

//     // Common Vehicle Fields
//     if (adUpdates.condition !== undefined)
//       updateData.condition = adUpdates.condition;
//     if (adUpdates.brand !== undefined) updateData.brand = adUpdates.brand;
//     if (adUpdates.model !== undefined) updateData.model = adUpdates.model;
//     if (adUpdates.trimEdition !== undefined)
//       updateData.trimEdition = adUpdates.trimEdition;

//     // Year Fields
//     if (adUpdates.manufacturedYear !== undefined)
//       updateData.manufacturedYear = adUpdates.manufacturedYear;
//     if (adUpdates.modelYear !== undefined)
//       updateData.modelYear = adUpdates.modelYear;

//     // Performance Fields
//     if (adUpdates.mileage !== undefined) updateData.mileage = adUpdates.mileage;
//     if (adUpdates.engineCapacity !== undefined)
//       updateData.engineCapacity = adUpdates.engineCapacity;

//     // Type-specific fields
//     if (adUpdates.fuelType !== undefined)
//       updateData.fuelType = adUpdates.fuelType;
//     if (adUpdates.transmission !== undefined)
//       updateData.transmission = adUpdates.transmission;
//     if (adUpdates.bodyType !== undefined)
//       updateData.bodyType = adUpdates.bodyType;
//     if (adUpdates.bikeType !== undefined)
//       updateData.bikeType = adUpdates.bikeType;
//     if (adUpdates.vehicleType !== undefined)
//       updateData.vehicleType = adUpdates.vehicleType;
//     if (adUpdates.serviceType !== undefined)
//       updateData.serviceType = adUpdates.serviceType;
//     if (adUpdates.partType !== undefined)
//       updateData.partType = adUpdates.partType;
//     if (adUpdates.maintenanceType !== undefined)
//       updateData.maintenanceType = adUpdates.maintenanceType;

//     // Contact Info
//     if (adUpdates.name !== undefined) updateData.name = adUpdates.name;
//     if (adUpdates.phoneNumber !== undefined)
//       updateData.phoneNumber = adUpdates.phoneNumber;
//     if (adUpdates.whatsappNumber !== undefined)
//       updateData.whatsappNumber = adUpdates.whatsappNumber;
//     if (adUpdates.termsAndConditions !== undefined)
//       updateData.termsAndConditions = adUpdates.termsAndConditions;

//     // Location Info
//     if (adUpdates.location !== undefined)
//       updateData.location = adUpdates.location;
//     if (adUpdates.address !== undefined) updateData.address = adUpdates.address;
//     if (adUpdates.province !== undefined)
//       updateData.province = adUpdates.province;
//     if (adUpdates.district !== undefined)
//       updateData.district = adUpdates.district;
//     if (adUpdates.city !== undefined) updateData.city = adUpdates.city;

//     // Miscellaneous
//     if (adUpdates.specialNote !== undefined)
//       updateData.specialNote = adUpdates.specialNote;
//     if (adUpdates.metadata !== undefined)
//       updateData.metadata = adUpdates.metadata;

//     // Handle media relationships update
//     if (adUpdates.mediaIds !== undefined && Array.isArray(adUpdates.mediaIds)) {
//       // Delete existing media relationships
//       await prisma.adMedia.deleteMany({
//         where: { adId },
//       });

//       // Create new media relationships if any
//       if (adUpdates.mediaIds.length > 0) {
//         const mediaRelations = adUpdates.mediaIds.map(
//           (mediaId: string, index: number) => ({
//             adId: adId,
//             mediaId: mediaId,
//             order: index,
//           })
//         );

//         await prisma.adMedia.createMany({
//           data: mediaRelations,
//         });
//       }
//     }

//     // Make the update
//     const updatedAd = await prisma.ad.update({
//       where: { id: adId },
//       data: updateData,
//     });

//     // Format dates for the response
//     const formattedAd = {
//       ...updatedAd,
//       createdAt: updatedAd.createdAt.toISOString(),
//       updatedAt: updatedAd.updatedAt.toISOString(),
//       boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
//       featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
//       expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
//       metadata:
//         typeof updatedAd.metadata === "object" ? updatedAd.metadata : null,
//     };

//     return c.json(formattedAd, HttpStatusCodes.OK);
//   } catch (error: any) {
//     console.error("[UPDATE AD] Error:", error);

//     // Match the error structure required by jsonContentOneOf
//     if (error.name === "ZodError") {
//       return c.json(
//         {
//           error: {
//             issues: error.issues,
//             name: "ZodError",
//           },
//           success: false,
//         },
//         HttpStatusCodes.UNPROCESSABLE_ENTITY
//       ) as any;
//     }

//     return c.json(
//       {
//         error: {
//           issues: [
//             {
//               code: "custom_error",
//               message: error.message || "Invalid request",
//               path: ["id"],
//             },
//           ],
//           name: "ValidationError",
//         },
//         success: false,
//       },
//       HttpStatusCodes.UNPROCESSABLE_ENTITY
//     ) as any;
//   }
// };

// // ---- Delete Ad Handler ----
// export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
//   try {
//     const adId = c.req.valid("param").id;
//     const user = c.get("user");

//     if (!user) {
//       return c.json(
//         { message: HttpStatusPhrases.UNAUTHORIZED },
//         HttpStatusCodes.UNAUTHORIZED
//       );
//     }

//     // Check if ad exists and if user has permission
//     const existingAd = await prisma.ad.findUnique({
//       where: { id: adId },
//     });

//     if (!existingAd) {
//       return c.json(
//         { message: HttpStatusPhrases.NOT_FOUND },
//         HttpStatusCodes.NOT_FOUND
//       );
//     }

//     // Verify user is the owner of the ad OR is an admin
//     const userRole = (user as any)?.role;
//     const isAdmin = userRole === "admin";

//     if (existingAd.createdBy !== user.id && !isAdmin) {
//       return c.json(
//         { message: "You don't have permission to delete this ad" },
//         HttpStatusCodes.FORBIDDEN
//       );
//     }

//     // Delete related records to avoid foreign key constraints
//     await prisma.adMedia.deleteMany({
//       where: { adId },
//     });

//     // Also delete any related records in analytics, GeoHeatmap, etc.
//     await prisma.adAnalytics.deleteMany({
//       where: { adId },
//     });

//     await prisma.geoHeatmap.deleteMany({
//       where: { adId },
//     });

//     await prisma.shareEvent.deleteMany({
//       where: { adId },
//     });

//     await prisma.adRevision.deleteMany({
//       where: { adId },
//     });

//     await prisma.favorite.deleteMany({
//       where: { adId },
//     });

//     await prisma.payment.deleteMany({
//       where: { adId },
//     });

//     await prisma.report.deleteMany({
//       where: { adId },
//     });

//     // Now delete the ad itself
//     await prisma.ad.delete({
//       where: { id: adId },
//     });

//     return c.body(null, HttpStatusCodes.NO_CONTENT);
//   } catch (error: any) {
//     console.error("[DELETE AD] Error:", error);

//     if (error.message && error.message.includes("Invalid")) {
//       return c.json(
//         {
//           error: {
//             issues: [
//               {
//                 code: "validation_error",
//                 path: ["id"],
//                 message: error.message,
//               },
//             ],
//             name: "ValidationError",
//           },
//           success: false,
//         },
//         HttpStatusCodes.UNPROCESSABLE_ENTITY
//       );
//     }

//     return c.json(
//       { message: error.message || "Failed to delete ad" },
//       HttpStatusCodes.INTERNAL_SERVER_ERROR
//     );
//   }
// };

// // ---- Approve Ad Handler ----
// export const approve: AppRouteHandler<ApproveRoute> = async (c) => {
//   try {
//     const adId = c.req.valid("param").id;
//     const user = c.get("user");

//     if (!user) {
//       return c.json(
//         { message: HttpStatusPhrases.UNAUTHORIZED },
//         HttpStatusCodes.UNAUTHORIZED
//       );
//     }

//     // Check if user is admin
//     const userRole = (user as any)?.role;
//     if (userRole !== "admin") {
//       return c.json(
//         { message: "Admin access required" },
//         HttpStatusCodes.FORBIDDEN
//       );
//     }

//     // Check if ad exists
//     const existingAd = await prisma.ad.findUnique({
//       where: { id: adId },
//     });

//     if (!existingAd) {
//       return c.json(
//         { message: HttpStatusPhrases.NOT_FOUND },
//         HttpStatusCodes.NOT_FOUND
//       );
//     }

//     // Update ad status to ACTIVE
//     const updatedAd = await prisma.ad.update({
//       where: { id: adId },
//       data: {
//         status: AdStatus.ACTIVE,
//         published: true,
//         isDraft: false,
//       },
//     });

//     // Format response
//     const formattedAd = {
//       ...updatedAd,
//       createdAt: updatedAd.createdAt.toISOString(),
//       updatedAt: updatedAd.updatedAt.toISOString(),
//       boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
//       featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
//       expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
//     };

//     return c.json(formattedAd, HttpStatusCodes.OK);
//   } catch (error: any) {
//     console.error("[APPROVE AD] Error:", error);
//     return c.json(
//       { message: error.message || "Failed to approve ad" },
//       HttpStatusCodes.INTERNAL_SERVER_ERROR
//     );
//   }
// };

// // ---- Reject Ad Handler ----
// export const reject: AppRouteHandler<RejectRoute> = async (c) => {
//   try {
//     const adId = c.req.valid("param").id;
//     const user = c.get("user");

//     if (!user) {
//       return c.json(
//         { message: HttpStatusPhrases.UNAUTHORIZED },
//         HttpStatusCodes.UNAUTHORIZED
//       );
//     }

//     // Check if user is admin
//     const userRole = (user as any)?.role;
//     if (userRole !== "admin") {
//       return c.json(
//         { message: "Admin access required" },
//         HttpStatusCodes.FORBIDDEN
//       );
//     }

//     // Check if ad exists
//     const existingAd = await prisma.ad.findUnique({
//       where: { id: adId },
//     });

//     if (!existingAd) {
//       return c.json(
//         { message: HttpStatusPhrases.NOT_FOUND },
//         HttpStatusCodes.NOT_FOUND
//       );
//     }

//     // Get rejection description from request body
//     const body = c.req.valid("json");

//     // Update ad status to REJECTED with rejection description
//     const updatedAd = await prisma.ad.update({
//       where: { id: adId },
//       data: {
//         status: AdStatus.REJECTED,
//         published: false,
//         rejectionDescription: body?.rejectionDescription || null,
//       },
//     });

//     // Format response
//     const formattedAd = {
//       ...updatedAd,
//       createdAt: updatedAd.createdAt.toISOString(),
//       updatedAt: updatedAd.updatedAt.toISOString(),
//       boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
//       featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
//       expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
//     };

//     return c.json(formattedAd, HttpStatusCodes.OK);
//   } catch (error: any) {
//     console.error("[REJECT AD] Error:", error);
//     return c.json(
//       { message: error.message || "Failed to reject ad" },
//       HttpStatusCodes.INTERNAL_SERVER_ERROR
//     );
//   }
// };



/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/types/server";
import {
  ListRoute,
  CreateRoute,
  GetOneRoute,
  UpdateRoute,
  RemoveRoute,
  ApproveRoute,
  RejectRoute,
} from "./ad.routes";
import { QueryParams } from "./ad.schemas";
import { AdStatus, AdType } from "@prisma/client";
import { sendAdPostedEmail, sendAdApprovalEmail } from "@/lib/email";


export const list: AppRouteHandler<ListRoute> = async (c) => {
  try {
    // Get raw query parameters (all come as strings from HTTP)
    const rawQuery = c.req.query() as any;

    // FIX: Convert string "true"/"false" to actual boolean for filterByUser
    // This handles the Zod validation issue where boolean is expected but string is received
    let processedQuery = { ...rawQuery };

    if (rawQuery.filterByUser !== undefined) {
      if (typeof rawQuery.filterByUser === "string") {
        // Convert string "true" to boolean true, anything else to false
        processedQuery.filterByUser =
          rawQuery.filterByUser.toLowerCase() === "true";
      }
      // If it's already a boolean, keep it as is
    }

    // FIX: Use the processed query for validation instead of trying to modify c.req.query()
    // The original approach of calling c.req.query({...}) doesn't actually modify the request
    const query = processedQuery;

    const page = query.page ?? "1";
    const limit = query.limit ?? "10";
    const search = query.search ?? "";
    const listingType = query.listingType ?? "";

    const session = c.get("session");
    const user = c.get("user");

    console.log("Session : ", session);
    // Convert to numbers and validate
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100 items
    const offset = (pageNum - 1) * limitNum;


    // --- Refactored filter logic: always use top-level AND array ---
    const andFilters: any[] = [];

    // Filter by current user if filterByUser is true
    if (query.filterByUser === true) {
      if (session?.userId === null) {
        return c.json(
          { message: "Authentication required to filter by user" },
          HttpStatusCodes.UNAUTHORIZED
        );
      }
      andFilters.push({ createdBy: session?.userId });
    }

    // Add search functionality if search term is provided
    // Search by: title, description, brand, model, phone number, user name
    if (search && search.trim() !== "") {
      const searchConditions: any[] = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { whatsappNumber: { contains: search, mode: "insensitive" } },
      ];

      // Also search by creator name/email if creator relation is available
      // Note: This requires the creator relation to be included in the query
      searchConditions.push({
        creator: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      });

      andFilters.push({
        OR: searchConditions,
      });
    }

    // Add listingType filtering if provided
    if (listingType && listingType.trim() !== "" && listingType.toLowerCase() !== "all") {
      const listingTypeValue = listingType.toUpperCase();
      console.log("Filtering by listingType:", listingTypeValue);
      const validListingTypes = ["SELL", "WANT", "RENT", "HIRE"];
      if (!validListingTypes.includes(listingTypeValue)) {
        console.log("Invalid listingType:", listingTypeValue);
        return c.json(
          { message: "Invalid listing type. Must be one of: SELL, WANT, RENT, HIRE" },
          400
        );
      }
      // Simply filter by the listing type without creating nested OR
      andFilters.push({ listingType: listingTypeValue });
    }

    // Filter by status: only show ACTIVE ads for public listings (unless admin is viewing or filtering by user)
    // Admin can see all ads, regular users and unauthenticated users only see ACTIVE ads in public listings
    // When filterByUser is true, show all user's ads regardless of status
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    // If not admin and not filtering by user, only show ACTIVE ads
    // This applies to:
    // - Unauthenticated users (user is null/undefined, so isAdmin is false)
    // - Authenticated non-admin users (isAdmin is false)
    // When filterByUser is true, show all ads (user wants to see their own ads with all statuses)
    if (!isAdmin && !query.filterByUser) {
      andFilters.push({ status: AdStatus.ACTIVE });
    }

    // Compose final whereCondition
    let whereCondition: any = {};
    if (andFilters.length === 1) {
      whereCondition = andFilters[0];
    } else if (andFilters.length > 1) {
      whereCondition = { AND: andFilters };
    }

    // Debug: Log the final whereCondition before count query
    console.log("[DEBUG] whereCondition before count:", JSON.stringify(whereCondition, null, 2));

    // Quick validation: Prisma does not allow nested AND/OR at the top level
    if (whereCondition && typeof whereCondition === "object") {
      const keys = Object.keys(whereCondition);
      if (keys.length === 1 && ["AND", "OR"].includes(keys[0]) && Array.isArray(whereCondition[keys[0]])) {
        // Check for nested AND/OR inside another AND/OR
        const arr = whereCondition[keys[0]];
        for (const cond of arr) {
          if (cond && typeof cond === "object") {
            const innerKeys = Object.keys(cond);
            if (innerKeys.length === 1 && ["AND", "OR"].includes(innerKeys[0]) && Array.isArray(cond[innerKeys[0]])) {
              console.error("[ERROR] Nested AND/OR detected in whereCondition. Prisma does not support this structure.");
              return c.json(
                { message: "Invalid filter structure: Nested AND/OR detected. Please check filter logic." },
                400
              );
            }
          }
        }
      }
    }

    // Count query for total number of records
    let totalAds;
    try {
      totalAds = await prisma.ad.count({
        where: whereCondition,
      });
      console.log("Total ads found:", totalAds);
    } catch (countError: any) {
      console.error("Error in count query:", countError);
      // Temporarily return error details to help debugging locally
      return c.json(
        { message: "Database error while counting ads", details: countError.message || String(countError) },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    // Main query with pagination
    let ads;
    try {
      // Fetch without creator relation to avoid Prisma throwing when creator is deleted
      ads = await prisma.ad.findMany({
        where: whereCondition,
        skip: offset,
        take: limitNum,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          media: true, // hydrate nested Media manually to tolerate orphaned AdMedia rows
          category: true,
          analytics: true,
        },
      });
      console.log("Ads query successful, found:", ads.length, "ads");

      // Manually fetch creators for ads that have valid createdBy
      const creatorIds = Array.from(new Set(ads.map((ad: any) => ad.createdBy).filter(Boolean)));
      let creatorsById: Record<string, any> = {};
      if (creatorIds.length > 0) {
        const creators = await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });
        creatorsById = creators.reduce((acc: any, creator: any) => {
          acc[creator.id] = creator;
          return acc;
        }, {} as Record<string, any>);
      }

      // Attach creator to each ad
      ads = ads.map((ad: any) => ({
        ...ad,
        creator: creatorsById[ad.createdBy] || null,
      }));
    } catch (queryError) {
      console.error("Error in main query:", queryError);
      return c.json(
        { message: "Database error while fetching ads " + queryError },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    // Hydrate AdMedia.media manually and filter out orphans (AdMedia entries referencing missing Media)
    const allAdMedia = ads.flatMap((ad: any) => ad.media || []);
    const mediaIds = Array.from(new Set(allAdMedia.map((m: any) => m.mediaId).filter(Boolean)));
    let mediaById: Record<string, any> = {};
    if (mediaIds.length > 0) {
      const medias = await prisma.media.findMany({ where: { id: { in: mediaIds } } });
      mediaById = medias.reduce((acc: any, m: any) => {
        acc[m.id] = m;
        return acc;
      }, {} as Record<string, any>);
    }
    ads = ads.map((ad: any) => ({
      ...ad,
      media: (ad.media || [])
        .map((am: any) => ({ ...am, media: mediaById[am.mediaId] }))
        .filter((am: any) => Boolean(am.media)),
    }));

    // Format the response data to ensure it matches the expected types
    const formattedAds = ads.map((ad) => ({
      ...ad,
      // Ensure these fields have the correct types
      price: ad.price ?? null,
      location: ad.location ?? null,
      metadata: typeof ad.metadata === "object" ? ad.metadata : null,
      tags: ad.tags ?? [],

      // Handle all enum types explicitly
      type: ad.type as
        | "CAR"
        | "VAN"
        | "MOTORCYCLE"
        | "BICYCLE"
        | "THREE_WHEEL"
        | "BUS"
        | "LORRY"
        | "HEAVY_DUTY"
        | "TRACTOR"
        | "AUTO_SERVICE"
        | "RENTAL"
        | "AUTO_PARTS"
        | "MAINTENANCE"
        | "BOAT",
      listingType: ((ad as any).listingType as "SELL" | "WANT" | "RENT" | "HIRE") ?? "SELL",
      status: ad.status as
        | "ACTIVE"
        | "EXPIRED"
        | "DRAFT"
        | "PENDING_REVIEW"
        | "REJECTED",
      fuelType: ad.fuelType as
        | "PETROL"
        | "DIESEL"
        | "HYBRID"
        | "ELECTRIC"
        | "GAS"
        | null,
      transmission: ad.transmission as "MANUAL" | "AUTOMATIC" | "CVT" | null,
      bodyType: ad.bodyType as "SALOON" | "HATCHBACK" | "STATION_WAGON" | null,
      bikeType: ad.bikeType as
        | "SCOOTER"
        | "E_BIKE"
        | "MOTORBIKES"
        | "QUADRICYCLES"
        | null,
      vehicleType: ad.vehicleType as
        | "BED_TRAILER"
        | "BOWSER"
        | "BULLDOZER"
        | "CRANE"
        | "DUMP_TRUCK"
        | "EXCAVATOR"
        | "LOADER"
        | "OTHER"
        | null,

      // Handle all the new dynamic fields
      condition: ad.condition ?? null,
      brand: ad.brand ?? null,
      model: ad.model ?? null,
      trimEdition: ad.trimEdition ?? null,
      manufacturedYear: ad.manufacturedYear ?? null,
      modelYear: ad.modelYear ?? null,
      mileage: ad.mileage ?? null,
      engineCapacity: ad.engineCapacity ?? null,
      serviceType: ad.serviceType ?? null,
      partType: ad.partType ?? null,
      maintenanceType: ad.maintenanceType ?? null,

      // Contact & Location fields
      name: ad.name ?? null,
      phoneNumber: ad.phoneNumber ?? null,
      whatsappNumber: ad.whatsappNumber ?? null,
      termsAndConditions: ad.termsAndConditions ?? null,
      address: ad.address ?? null,
      province: ad.province ?? null,
      district: ad.district ?? null,
      city: ad.city ?? null,
      specialNote: ad.specialNote ?? null,

      // SEO fields
      seoTitle: ad.seoTitle ?? null,
      seoDescription: ad.seoDescription ?? null,
      seoSlug: ad.seoSlug ?? null,
      categoryId: ad.categoryId ?? null,

      // Status fields
      published: ad.published ?? false,
      isDraft: ad.isDraft ?? true,
      boosted: ad.boosted ?? false,
      featured: ad.featured ?? false,

      // Convert Date objects to ISO strings
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
      boostExpiry: ad.boostExpiry?.toISOString() ?? null,
      featureExpiry: ad.featureExpiry?.toISOString() ?? null,
      expiryDate: ad.expiryDate?.toISOString() ?? null,
    }));

    return c.json(
      {
        ads: formattedAds,
        pagination: {
          total: totalAds,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalAds / limitNum),
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

// ---- Create Ad Handler ----
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  try {
    const adDetails = c.req.valid("json");
    const user = c.get("user");
    const session = c.get("session");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      ) as any;
    }

    // if (!session?.activeOrganizationId) {
    //   return c.json(
    //     { message: "Active organization is required to create an ad." },
    //     HttpStatusCodes.UNAUTHORIZED
    //   );
    // }

    // Prepare Seo slug based on title
    let seoSlug = "";
    if (adDetails.title) {
      seoSlug = adDetails.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    } else {
      // Generate a slug from brand, model, and year if available
      const slugParts = [
        adDetails.brand,
        adDetails.model,
        adDetails.manufacturedYear || adDetails.modelYear,
      ].filter(Boolean);

      if (slugParts.length > 0) {
        seoSlug = slugParts
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      } else {
        // If no title or vehicle info, use a placeholder with timestamp
        seoSlug = `vehicle-${Date.now()}`;
      }
    }

    // Bind random suffix to seoSlug for ensure uniqueness
    seoSlug += `-${Math.random().toString(36).substring(2, 8)}`;

    // Determine status: if published and not draft, set to PENDING_REVIEW, otherwise DRAFT
    const isPublished = adDetails.published || false;
    const isDraft = adDetails.isDraft ?? true;
    const adStatus = (!isDraft && isPublished) ? AdStatus.PENDING_REVIEW : AdStatus.DRAFT;

    const createdAd = await prisma.ad.create({
      data: {
        orgId: session?.activeOrganizationId || "",
        createdBy: user.id,
        title: adDetails.title || "",
        description: adDetails.description || "",
        type: (adDetails.type as AdType) || AdType.CAR,
        listingType: adDetails.listingType || "SELL",
        status: adStatus,
        seoSlug: seoSlug,

        // Basic Info
        published: adDetails.published || false,
        isDraft: adDetails.isDraft ?? true,
        boosted: adDetails.boosted || false,
        featured: adDetails.featured || false,

        // SEO fields
        seoTitle: adDetails.seoTitle || null,
        seoDescription: adDetails.seoDescription || null,

        // Category & Tags
        categoryId: adDetails.categoryId || null,
        tags: adDetails.tags || [],

        // Pricing
        price: adDetails.price || null,

        // Common Vehicle Fields (used by multiple types)
        condition: adDetails.condition || null,
        brand: adDetails.brand || null,
        model: adDetails.model || null,
        trimEdition: adDetails.trimEdition || null,

        // Year Fields (different names for different types)
        manufacturedYear: adDetails.manufacturedYear || null, // Used by: Car, Motor Bike
        modelYear: adDetails.modelYear || null, // Used by: Van, Three Wheeler, Bus, Lorry, Heavy Duty, Tractor

        // Performance Fields
        mileage: adDetails.mileage || null, // Used by: Car, Van, Motor Bike, Three Wheeler, Bus, Lorry
        engineCapacity: adDetails.engineCapacity || null, // Used by: Car, Van, Motor Bike, Bus, Lorry

        // Car & Van Specific Fields
        fuelType: adDetails.fuelType || null, // Used by: Car
        transmission: adDetails.transmission || null, // Used by: Car
        bodyType: adDetails.bodyType || null, // Used by: Car

        // Motor Bike Specific Fields
        bikeType: adDetails.bikeType || null, // Used by: Motor Bike

        // Heavy Duty Specific Fields
        vehicleType: adDetails.vehicleType || null, // Used by: Heavy Duty

        // Service & Parts Specific Fields
        serviceType: adDetails.serviceType || null, // Used by: Auto Service, Rental
        partType: adDetails.partType || null, // Used by: Auto Parts
        maintenanceType: adDetails.maintenanceType || null, // Used by: Maintenance

        // Contact Info
        name: adDetails.name || null,
        phoneNumber: adDetails.phoneNumber || null,
        whatsappNumber: adDetails.whatsappNumber || null,
        termsAndConditions: adDetails.termsAndConditions || null,

        // Location Info
        location: adDetails.location || null,
        address: adDetails.address || null,
        province: adDetails.province || null,
        district: adDetails.district || null,
        city: adDetails.city || null,

        // Miscellaneous
        specialNote: adDetails.specialNote || null,
        metadata: adDetails.metadata || {},
      },
    });

    // Handle media relationships if mediaIds are provided
    if (
      adDetails.mediaIds &&
      Array.isArray(adDetails.mediaIds) &&
      adDetails.mediaIds.length > 0
    ) {
      const mediaRelations = adDetails.mediaIds.map(
        (mediaId: string, index: number) => ({
          adId: createdAd.id,
          mediaId: mediaId,
          order: index,
        })
      );

      await prisma.adMedia.createMany({
        data: mediaRelations,
      });
    }

    // Format dates for the response and ensure metadata is an object or null
    const formattedAd = {
      ...createdAd,
      createdAt: createdAd.createdAt.toISOString(),
      updatedAt: createdAd.updatedAt.toISOString(),
      boostExpiry: createdAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: createdAd.featureExpiry?.toISOString() ?? null,
      expiryDate: createdAd.expiryDate?.toISOString() ?? null,
      // Ensure metadata is an object or null
      metadata:
        typeof createdAd.metadata === "object" ? createdAd.metadata : null,
    };

    // Send email to the user if the ad is posted (not a draft)
    if (adStatus === AdStatus.PENDING_REVIEW && user.email) {
      try {
        await sendAdPostedEmail({
          email: user.email,
          name: user.name || "User",
          adTitle: createdAd.title
        });
      } catch (emailError) {
        console.error("Failed to send ad posted email:", emailError);
        // We don't want to fail the ad creation if email fails
      }
    }

    return c.json(formattedAd, HttpStatusCodes.CREATED);
  } catch (error: any) {
    console.error("[CREATE AD] Error:", error);

    if (error.name === "ZodError") {
      return c.json(
        {
          message: "Validation error",
          details: error.issues,
        },
        HttpStatusCodes.UNPROCESSABLE_ENTITY
      );
    }

    return c.json(
      { message: error.message || HttpStatusPhrases.UNPROCESSABLE_ENTITY },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
  }
};

// ---- Get single Ad Handler ----
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;

    let ad: any;
    try {
      // Do not include nested Media to tolerate orphaned relations; hydrate manually below
      ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: {
          media: true,
          category: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          analytics: true,
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          favorites: {
            select: {
              userId: true,
            },
          },
          reports: {
            select: {
              id: true,
              reason: true,
              status: true,
            },
          },
          shareEvents: {
            select: {
              platform: true,
              sharedAt: true,
            },
          },
        },
      });
    } catch (findError: any) {
      // Handle Prisma inconsistent query when a required relation is missing in DB (e.g., org)
      const msg = String(findError?.message || "");
      if (msg.includes("Field org is required to return data")) {
        console.warn("[GET AD] Org relation missing for ad, retrying without org include", adId);
        // Retry without org include to return the ad even when org is missing
        ad = await prisma.ad.findUnique({
          where: { id: adId },
          include: {
            media: true,
            category: true,
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            analytics: true,
            // org omitted intentionally
            favorites: {
              select: {
                userId: true,
              },
            },
            reports: {
              select: {
                id: true,
                reason: true,
                status: true,
              },
            },
            shareEvents: {
              select: {
                platform: true,
                sharedAt: true,
              },
            },
          },
        });
      } else {
        throw findError;
      }
    }

    if (!ad) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Manually hydrate nested Media and filter out orphaned AdMedia entries
    const adMediaList = (ad.media || []) as Array<any>;
    const mediaIds = Array.from(new Set(adMediaList.map((m: any) => m.mediaId).filter(Boolean)));
    if (mediaIds.length > 0) {
      const medias = await prisma.media.findMany({ where: { id: { in: mediaIds } } });
      const mediaById = medias.reduce((acc: any, m: any) => {
        acc[m.id] = m;
        return acc;
      }, {} as Record<string, any>);
      ad = {
        ...ad,
        media: adMediaList
          .map((am: any) => ({ ...am, media: mediaById[am.mediaId] }))
          .filter((am: any) => Boolean(am.media)),
      };
    }

    // Format dates for the response and ensure all fields have correct types
    const formattedAd = {
      ...ad,
      // Ensure these fields have the correct types
      price: ad.price ?? null,
      location: ad.location ?? null,
      metadata: typeof ad.metadata === "object" ? ad.metadata : null,
      tags: ad.tags ?? [],

      // Handle all enum types explicitly
      type: ad.type as
        | "CAR"
        | "VAN"
        | "MOTORCYCLE"
        | "BICYCLE"
        | "THREE_WHEEL"
        | "BUS"
        | "LORRY"
        | "HEAVY_DUTY"
        | "TRACTOR"
        | "AUTO_SERVICE"
        | "RENTAL"
        | "AUTO_PARTS"
        | "MAINTENANCE"
        | "BOAT",
      listingType: (ad.listingType as "SELL" | "WANT" | "RENT" | "HIRE") ?? "SELL",
      status: ad.status as
        | "ACTIVE"
        | "EXPIRED"
        | "DRAFT"
        | "PENDING_REVIEW"
        | "REJECTED",
      fuelType: ad.fuelType as
        | "PETROL"
        | "DIESEL"
        | "HYBRID"
        | "ELECTRIC"
        | "GAS"
        | null,
      transmission: ad.transmission as "MANUAL" | "AUTOMATIC" | "CVT" | null,
      bodyType: ad.bodyType as "SALOON" | "HATCHBACK" | "STATION_WAGON" | null,
      bikeType: ad.bikeType as
        | "SCOOTER"
        | "E_BIKE"
        | "MOTORBIKES"
        | "QUADRICYCLES"
        | null,
      vehicleType: ad.vehicleType as
        | "BED_TRAILER"
        | "BOWSER"
        | "BULLDOZER"
        | "CRANE"
        | "DUMP_TRUCK"
        | "EXCAVATOR"
        | "LOADER"
        | "OTHER"
        | null,

      // Handle all the new dynamic fields
      condition: ad.condition ?? null,
      brand: ad.brand ?? null,
      model: ad.model ?? null,
      trimEdition: ad.trimEdition ?? null,
      manufacturedYear: ad.manufacturedYear ?? null,
      modelYear: ad.modelYear ?? null,
      mileage: ad.mileage ?? null,
      engineCapacity: ad.engineCapacity ?? null,
      serviceType: ad.serviceType ?? null,
      partType: ad.partType ?? null,
      maintenanceType: ad.maintenanceType ?? null,

      // Contact & Location fields
      name: ad.name ?? null,
      phoneNumber: ad.phoneNumber ?? null,
      whatsappNumber: ad.whatsappNumber ?? null,
      termsAndConditions: ad.termsAndConditions ?? null,
      address: ad.address ?? null,
      province: ad.province ?? null,
      district: ad.district ?? null,
      city: ad.city ?? null,
      specialNote: ad.specialNote ?? null,

      // SEO fields
      seoTitle: ad.seoTitle ?? null,
      seoDescription: ad.seoDescription ?? null,
      seoSlug: ad.seoSlug ?? null,
      categoryId: ad.categoryId ?? null,

      // Status fields
      published: ad.published ?? false,
      isDraft: ad.isDraft ?? true,
      boosted: ad.boosted ?? false,
      featured: ad.featured ?? false,

      // Convert Date objects to ISO strings
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
      boostExpiry: ad.boostExpiry?.toISOString() ?? null,
      featureExpiry: ad.featureExpiry?.toISOString() ?? null,
      expiryDate: ad.expiryDate?.toISOString() ?? null,
    };

    return c.json(formattedAd, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[GET AD] Error:", error);

    return c.json(
      { message: error.message || "Invalid request" },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
  }
};

// ---- Update Ad Handler ----
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const adUpdates = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Check if ad exists and if user has permission
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      ) as any;
    }

    // Verify user is the owner of the ad
    if (existingAd.createdBy !== user.id) {
      return c.json(
        { message: "You don't have permission to update this ad" },
        HttpStatusCodes.FORBIDDEN
      ) as any;
    }

    // Prepare update data with all the new dynamic fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Basic fields
    if (adUpdates.title !== undefined) updateData.title = adUpdates.title;
    if (adUpdates.description !== undefined)
      updateData.description = adUpdates.description;
    if (adUpdates.type !== undefined) updateData.type = adUpdates.type;
    if (adUpdates.price !== undefined) updateData.price = adUpdates.price;
    if (adUpdates.published !== undefined)
      updateData.published = adUpdates.published;
    if (adUpdates.isDraft !== undefined) updateData.isDraft = adUpdates.isDraft;

    // Update status based on published and isDraft flags
    // If ad is being published (isDraft=false and published=true), set to PENDING_REVIEW
    const willBePublished = (adUpdates.published !== undefined ? adUpdates.published : existingAd.published) &&
      (adUpdates.isDraft !== undefined ? !adUpdates.isDraft : !existingAd.isDraft);
    const willBeDraft = adUpdates.isDraft !== undefined ? adUpdates.isDraft : existingAd.isDraft;

    if (willBePublished && !willBeDraft) {
      // Ad is being published, set status to PENDING_REVIEW
      updateData.status = AdStatus.PENDING_REVIEW;
    } else if (willBeDraft) {
      // Ad is being saved as draft, set status to DRAFT
      updateData.status = AdStatus.DRAFT;
    }
    if (adUpdates.boosted !== undefined) updateData.boosted = adUpdates.boosted;
    if (adUpdates.featured !== undefined)
      updateData.featured = adUpdates.featured;

    // SEO fields
    if (adUpdates.seoTitle !== undefined)
      updateData.seoTitle = adUpdates.seoTitle;
    if (adUpdates.seoDescription !== undefined)
      updateData.seoDescription = adUpdates.seoDescription;

    // Category & Tags
    if (adUpdates.categoryId !== undefined)
      updateData.categoryId = adUpdates.categoryId;
    if (adUpdates.tags !== undefined) updateData.tags = adUpdates.tags;

    // Common Vehicle Fields
    if (adUpdates.condition !== undefined)
      updateData.condition = adUpdates.condition;
    if (adUpdates.brand !== undefined) updateData.brand = adUpdates.brand;
    if (adUpdates.model !== undefined) updateData.model = adUpdates.model;
    if (adUpdates.trimEdition !== undefined)
      updateData.trimEdition = adUpdates.trimEdition;

    // Year Fields
    if (adUpdates.manufacturedYear !== undefined)
      updateData.manufacturedYear = adUpdates.manufacturedYear;
    if (adUpdates.modelYear !== undefined)
      updateData.modelYear = adUpdates.modelYear;

    // Performance Fields
    if (adUpdates.mileage !== undefined) updateData.mileage = adUpdates.mileage;
    if (adUpdates.engineCapacity !== undefined)
      updateData.engineCapacity = adUpdates.engineCapacity;

    // Type-specific fields
    if (adUpdates.fuelType !== undefined)
      updateData.fuelType = adUpdates.fuelType;
    if (adUpdates.transmission !== undefined)
      updateData.transmission = adUpdates.transmission;
    if (adUpdates.bodyType !== undefined)
      updateData.bodyType = adUpdates.bodyType;
    if (adUpdates.bikeType !== undefined)
      updateData.bikeType = adUpdates.bikeType;
    if (adUpdates.vehicleType !== undefined)
      updateData.vehicleType = adUpdates.vehicleType;
    if (adUpdates.serviceType !== undefined)
      updateData.serviceType = adUpdates.serviceType;
    if (adUpdates.partType !== undefined)
      updateData.partType = adUpdates.partType;
    if (adUpdates.maintenanceType !== undefined)
      updateData.maintenanceType = adUpdates.maintenanceType;

    // Contact Info
    if (adUpdates.name !== undefined) updateData.name = adUpdates.name;
    if (adUpdates.phoneNumber !== undefined)
      updateData.phoneNumber = adUpdates.phoneNumber;
    if (adUpdates.whatsappNumber !== undefined)
      updateData.whatsappNumber = adUpdates.whatsappNumber;
    if (adUpdates.termsAndConditions !== undefined)
      updateData.termsAndConditions = adUpdates.termsAndConditions;

    // Location Info
    if (adUpdates.location !== undefined)
      updateData.location = adUpdates.location;
    if (adUpdates.address !== undefined) updateData.address = adUpdates.address;
    if (adUpdates.province !== undefined)
      updateData.province = adUpdates.province;
    if (adUpdates.district !== undefined)
      updateData.district = adUpdates.district;
    if (adUpdates.city !== undefined) updateData.city = adUpdates.city;

    // Miscellaneous
    if (adUpdates.specialNote !== undefined)
      updateData.specialNote = adUpdates.specialNote;
    if (adUpdates.metadata !== undefined)
      updateData.metadata = adUpdates.metadata;

    // Handle media relationships update
    if (adUpdates.mediaIds !== undefined && Array.isArray(adUpdates.mediaIds)) {
      // Delete existing media relationships
      await prisma.adMedia.deleteMany({
        where: { adId },
      });

      // Create new media relationships if any
      if (adUpdates.mediaIds.length > 0) {
        const mediaRelations = adUpdates.mediaIds.map(
          (mediaId: string, index: number) => ({
            adId: adId,
            mediaId: mediaId,
            order: index,
          })
        );

        await prisma.adMedia.createMany({
          data: mediaRelations,
        });
      }
    }

    // Make the update
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: updateData,
    });

    // Format dates for the response
    const formattedAd = {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
      boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
      expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
      metadata:
        typeof updatedAd.metadata === "object" ? updatedAd.metadata : null,
    };

    return c.json(formattedAd, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[UPDATE AD] Error:", error);

    // Match the error structure required by jsonContentOneOf
    if (error.name === "ZodError") {
      return c.json(
        {
          error: {
            issues: error.issues,
            name: "ZodError",
          },
          success: false,
        },
        HttpStatusCodes.UNPROCESSABLE_ENTITY
      ) as any;
    }

    return c.json(
      {
        error: {
          issues: [
            {
              code: "custom_error",
              message: error.message || "Invalid request",
              path: ["id"],
            },
          ],
          name: "ValidationError",
        },
        success: false,
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    ) as any;
  }
};

// ---- Delete Ad Handler ----
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Check if ad exists and if user has permission
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Verify user is the owner of the ad OR is an admin
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    if (existingAd.createdBy !== user.id && !isAdmin) {
      return c.json(
        { message: "You don't have permission to delete this ad" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    // Delete related records to avoid foreign key constraints
    await prisma.adMedia.deleteMany({
      where: { adId },
    });

    // Also delete any related records in analytics, GeoHeatmap, etc.
    await prisma.adAnalytics.deleteMany({
      where: { adId },
    });

    await prisma.geoHeatmap.deleteMany({
      where: { adId },
    });

    await prisma.shareEvent.deleteMany({
      where: { adId },
    });

    await prisma.adRevision.deleteMany({
      where: { adId },
    });

    await prisma.favorite.deleteMany({
      where: { adId },
    });

    await prisma.payment.deleteMany({
      where: { adId },
    });

    await prisma.report.deleteMany({
      where: { adId },
    });

    // Now delete the ad itself
    await prisma.ad.delete({
      where: { id: adId },
    });

    return c.body(null, HttpStatusCodes.NO_CONTENT);
  } catch (error: any) {
    console.error("[DELETE AD] Error:", error);

    if (error.message && error.message.includes("Invalid")) {
      return c.json(
        {
          error: {
            issues: [
              {
                code: "validation_error",
                path: ["id"],
                message: error.message,
              },
            ],
            name: "ValidationError",
          },
          success: false,
        },
        HttpStatusCodes.UNPROCESSABLE_ENTITY
      );
    }

    return c.json(
      { message: error.message || "Failed to delete ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---- Approve Ad Handler ----
export const approve: AppRouteHandler<ApproveRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Check if user is admin
    const userRole = (user as any)?.role;
    if (userRole !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    // Check if ad exists and fetch creator data
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Update ad status to ACTIVE
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: AdStatus.ACTIVE,
        published: true,
        isDraft: false,
      },
    });

    // Send approval email to the ad creator
    try {
      if (existingAd.creator?.email && existingAd.creator?.name) {
        await sendAdApprovalEmail({
          email: existingAd.creator.email,
          name: existingAd.creator.name,
          adTitle: existingAd.title,
          adId: adId,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the approval
      console.error("[APPROVE AD] Failed to send approval email:", emailError);
    }

    // Format response
    const formattedAd = {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
      boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
      expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
    };

    return c.json(formattedAd, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[APPROVE AD] Error:", error);
    return c.json(
      { message: error.message || "Failed to approve ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---- Reject Ad Handler ----
export const reject: AppRouteHandler<RejectRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Check if user is admin
    const userRole = (user as any)?.role;
    if (userRole !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    // Check if ad exists
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Get rejection description from request body
    const body = c.req.valid("json");

    // Update ad status to REJECTED with rejection description
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: AdStatus.REJECTED,
        published: false,
        rejectionDescription: body?.rejectionDescription || null,
      },
    });

    // Format response
    const formattedAd = {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
      boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
      expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
    };

    return c.json(formattedAd, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[REJECT AD] Error:", error);
    return c.json(
      { message: error.message || "Failed to reject ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};