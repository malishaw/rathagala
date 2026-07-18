import { db } from "@/server/db";
import { 
  ads, 
  adMedia, 
  adAnalytics, 
  geoHeatmaps, 
  shareEvents, 
  adRevisions, 
  favorites, 
  payments, 
  reports 
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import type { AppRouteHandler } from "@/types/server";
import type { RemoveRoute, PermanentDeleteRoute, BulkPermanentDeleteRoute } from "./ad.routes";

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const isAdmin = (user as any)?.role === "admin";
    if (existingAd.createdBy !== user.id && !isAdmin) {
      return c.json(
        { message: "You don't have permission to delete this ad" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const metadata = (existingAd.metadata as any) || {};
    metadata.deletedByUser = true;
    metadata.deletedAt = new Date().toISOString();
    metadata.deletedReason = body?.reason;

    await db.update(ads)
      .set({
        published: false,
        metadata: metadata,
      })
      .where(eq(ads.id, adId));

    const adTitle = existingAd.title?.trim();
    const successMessage = adTitle
      ? `Your ${adTitle} ad successfully deleted.`
      : "Ad deleted successfully";

    return c.json({ message: successMessage }, HttpStatusCodes.OK);
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
    ) as any;
  }
};

export const permanentDelete: AppRouteHandler<PermanentDeleteRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const userRole = (user as any)?.role;
    if (userRole !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    await db.delete(adMedia).where(eq(adMedia.adId, adId));
    await db.delete(adAnalytics).where(eq(adAnalytics.adId, adId));
    await db.delete(geoHeatmaps).where(eq(geoHeatmaps.adId, adId));
    await db.delete(shareEvents).where(eq(shareEvents.adId, adId));
    await db.delete(adRevisions).where(eq(adRevisions.adId, adId));
    await db.delete(favorites).where(eq(favorites.adId, adId));
    await db.delete(payments).where(eq(payments.adId, adId));
    await db.delete(reports).where(eq(reports.adId, adId));

    await db.delete(ads).where(eq(ads.id, adId));

    return c.json(
      { message: "Ad permanently deleted successfully" },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[PERMANENT DELETE AD] Error:", error);

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
      { message: error.message || "Failed to permanently delete ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
  }
};

export const bulkPermanentDelete: AppRouteHandler<BulkPermanentDeleteRoute> = async (c) => {
  try {
    const { adIds } = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const userRole = (user as any)?.role;
    if (userRole !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    if (!adIds || adIds.length === 0) {
      return c.json(
        { message: "No ad IDs provided" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const existingAds = await db.query.ads.findMany({
      where: inArray(ads.id, adIds),
      columns: { id: true }
    });
    
    const existingAdIds = existingAds.map(ad => ad.id);

    if (existingAdIds.length === 0) {
      return c.json(
        { message: "None of the provided ads were found" },
        HttpStatusCodes.NOT_FOUND
      ) as any;
    }

    await db.delete(adMedia).where(inArray(adMedia.adId, existingAdIds));
    await db.delete(adAnalytics).where(inArray(adAnalytics.adId, existingAdIds));
    await db.delete(geoHeatmaps).where(inArray(geoHeatmaps.adId, existingAdIds));
    await db.delete(shareEvents).where(inArray(shareEvents.adId, existingAdIds));
    await db.delete(adRevisions).where(inArray(adRevisions.adId, existingAdIds));
    await db.delete(favorites).where(inArray(favorites.adId, existingAdIds));
    await db.delete(payments).where(inArray(payments.adId, existingAdIds));
    await db.delete(reports).where(inArray(reports.adId, existingAdIds));

    await db.delete(ads).where(inArray(ads.id, existingAdIds));

    const deletedCount = existingAdIds.length;
    const notFoundCount = adIds.length - deletedCount;
    
    let message = `${deletedCount} ad(s) permanently deleted successfully`;
    if (notFoundCount > 0) {
      message += `. ${notFoundCount} ad(s) were not found.`;
    }

    return c.json(
      { message },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[BULK PERMANENT DELETE ADS] Error:", error);

    return c.json(
      { message: error.message || "Failed to permanently delete ads" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
  }
};
