import { db } from "@/server/db";
import { ads, adMedia } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import type { AppRouteHandler } from "@/types/server";
import type { CreateRoute } from "./ad.routes";
import { sendAdPostedEmail } from "@/lib/email";

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

    let seoSlug = "";
    if (adDetails.title) {
      seoSlug = adDetails.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    } else {
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
        seoSlug = `vehicle-${Date.now()}`;
      }
    }

    seoSlug += `-${Math.random().toString(36).substring(2, 8)}`;

    const isPublished = adDetails.published || false;
    const isDraft = adDetails.isDraft ?? true;
    const adStatus = (!isDraft && isPublished) ? "PENDING_REVIEW" : "DRAFT";

    const [createdAd] = await db.insert(ads).values({
      orgId: session?.activeOrganizationId || "",
      createdBy: user.id,
      title: adDetails.title || "",
      description: adDetails.description || "",
      type: (adDetails.type as any) || "CAR",
      listingType: (adDetails.listingType as any) || "SELL",
      status: adStatus,
      seoSlug: seoSlug,

      published: adDetails.published || false,
      isDraft: adDetails.isDraft ?? true,

      seoTitle: adDetails.seoTitle || null,
      seoDescription: adDetails.seoDescription || null,

      categoryId: adDetails.categoryId || null,
      tags: adDetails.tags || [],

      price: adDetails.price || null,

      condition: adDetails.condition || null,
      brand: adDetails.brand || null,
      model: adDetails.model || null,
      grade: adDetails.grade || null,
      trimEdition: adDetails.trimEdition || null,
      color: adDetails.color || null,

      manufacturedYear: adDetails.manufacturedYear || null,
      modelYear: adDetails.modelYear || null,

      mileage: adDetails.mileage || null,
      engineCapacity: adDetails.engineCapacity || null,

      fuelType: (adDetails.fuelType as any) || null,
      transmission: (adDetails.transmission as any) || null,
      bodyType: (adDetails.bodyType as any) || null,
      bikeType: (adDetails.bikeType as any) || null,
      vehicleType: (adDetails.vehicleType as any) || null,

      serviceType: adDetails.serviceType || null,
      partType: adDetails.partType || null,
      partName: adDetails.partName || null,
      partCategoryId: adDetails.partCategoryId || null,
      compatibleVehicleType: adDetails.compatibleVehicleType || null,
      maintenanceType: adDetails.maintenanceType || null,

      name: adDetails.name || null,
      phoneNumber: adDetails.phoneNumber || null,
      whatsappNumber: adDetails.whatsappNumber || null,
      termsAndConditions: adDetails.termsAndConditions || null,

      location: adDetails.location || null,
      address: adDetails.address || null,
      province: adDetails.province || null,
      district: adDetails.district || null,
      city: adDetails.city || null,

      specialNote: adDetails.specialNote || null,
      metadata: adDetails.metadata || {},
      
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

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

      await db.insert(adMedia).values(mediaRelations);
    }

    const formattedAd = {
      ...createdAd,
      createdAt: createdAd.createdAt.toISOString(),
      updatedAt: createdAd.updatedAt.toISOString(),
      boostExpiry: createdAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: createdAd.featureExpiry?.toISOString() ?? null,
      expiryDate: createdAd.expiryDate?.toISOString() ?? null,
      metadata: typeof createdAd.metadata === "object" ? createdAd.metadata : null,
    };

    if (adStatus === "PENDING_REVIEW" && user.email) {
      try {
        await sendAdPostedEmail({
          email: user.email,
          name: user.name || "User",
          adTitle: createdAd.title || ""
        });
      } catch (emailError) {
        console.error("Failed to send ad posted email:", emailError);
      }
    }

    return c.json(formattedAd as any, HttpStatusCodes.CREATED);
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
