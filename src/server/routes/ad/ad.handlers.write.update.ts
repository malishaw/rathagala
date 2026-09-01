import { db } from "@/server/db";
import { ads, adMedia } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { formatIsoDate } from "@/server/helpers/date-utils";
import { safeBackgroundJob } from "@/server/helpers/execution-context";
import type { AppRouteHandler } from "@/types/server";
import type { UpdateRoute } from "./ad.routes";
import {
  sendListingUpdatedEmail,
  sendAdPostedEmail,
  sendNewAdSubmittedAdminEmail,
} from "@/lib/email";

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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adId);
    
    let whereCondition;
    if (isUuid) {
      whereCondition = eq(ads.id, adId);
    } else {
      whereCondition = eq(ads.seoSlug, adId);
    }

    const existingAd = await db.query.ads.findFirst({
      where: whereCondition,
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      ) as any;
    }

    const isAdmin = (user as any)?.role === "admin";
    if (existingAd.createdBy !== user.id && !isAdmin) {
      return c.json(
        { message: "You don't have permission to update this ad" },
        HttpStatusCodes.FORBIDDEN
      ) as any;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (adUpdates.title !== undefined) updateData.title = adUpdates.title;
    if (adUpdates.description !== undefined)
      updateData.description = adUpdates.description;
    if (adUpdates.type !== undefined) updateData.type = adUpdates.type;
    if (adUpdates.price !== undefined) {
      updateData.price = (adUpdates.price && Number(adUpdates.price) > 0) ? Number(adUpdates.price) : null;
    }
    if (adUpdates.published !== undefined)
      updateData.published = adUpdates.published;
    if (adUpdates.isDraft !== undefined) updateData.isDraft = adUpdates.isDraft;

    if (isAdmin && (adUpdates as any).status !== undefined) {
      updateData.status = (adUpdates as any).status;
      if ((adUpdates as any).status === "ACTIVE") {
        updateData.published = true;
        updateData.isDraft = false;
      }
    } else {
      const willBePublished = (adUpdates.published !== undefined ? adUpdates.published : existingAd.published) &&
        (adUpdates.isDraft !== undefined ? !adUpdates.isDraft : !existingAd.isDraft);
      const willBeDraft = adUpdates.isDraft !== undefined ? adUpdates.isDraft : existingAd.isDraft;

      if (willBePublished && !willBeDraft) {
        updateData.status = "PENDING_REVIEW";
      } else if (willBeDraft) {
        updateData.status = "DRAFT";
      }
    }

    if (isAdmin) {
      if ((adUpdates as any).boosted !== undefined) updateData.boosted = (adUpdates as any).boosted;
      if ((adUpdates as any).featured !== undefined) updateData.featured = (adUpdates as any).featured;
      if ((adUpdates as any).rejectionDescription !== undefined) updateData.rejectionDescription = (adUpdates as any).rejectionDescription;
    }

    if (adUpdates.seoTitle !== undefined)
      updateData.seoTitle = adUpdates.seoTitle;
    if (adUpdates.seoDescription !== undefined)
      updateData.seoDescription = adUpdates.seoDescription;

    if (adUpdates.categoryId !== undefined)
      updateData.categoryId = adUpdates.categoryId;
    if (adUpdates.tags !== undefined) updateData.tags = adUpdates.tags;

    if (adUpdates.condition !== undefined)
      updateData.condition = adUpdates.condition;
    if (adUpdates.brand !== undefined) updateData.brand = adUpdates.brand;
    if (adUpdates.model !== undefined) updateData.model = adUpdates.model;
    if (adUpdates.grade !== undefined) updateData.grade = adUpdates.grade;
    if (adUpdates.trimEdition !== undefined)
      updateData.trimEdition = adUpdates.trimEdition;
    if (adUpdates.color !== undefined)
      updateData.color = adUpdates.color;

    if (adUpdates.manufacturedYear !== undefined)
      updateData.manufacturedYear = adUpdates.manufacturedYear;
    if (adUpdates.modelYear !== undefined)
      updateData.modelYear = adUpdates.modelYear;

    if (adUpdates.mileage !== undefined) updateData.mileage = adUpdates.mileage;
    if (adUpdates.engineCapacity !== undefined)
      updateData.engineCapacity = adUpdates.engineCapacity;

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
    if (adUpdates.partName !== undefined)
      updateData.partName = adUpdates.partName;
    if (adUpdates.partCategoryId !== undefined)
      updateData.partCategoryId = adUpdates.partCategoryId;
    if (adUpdates.compatibleVehicleType !== undefined)
      updateData.compatibleVehicleType = adUpdates.compatibleVehicleType;
    if (adUpdates.maintenanceType !== undefined)
      updateData.maintenanceType = adUpdates.maintenanceType;

    if (adUpdates.name !== undefined) updateData.name = adUpdates.name;
    if (adUpdates.phoneNumber !== undefined)
      updateData.phoneNumber = adUpdates.phoneNumber;
    if (adUpdates.whatsappNumber !== undefined)
      updateData.whatsappNumber = adUpdates.whatsappNumber;
    if (adUpdates.termsAndConditions !== undefined)
      updateData.termsAndConditions = adUpdates.termsAndConditions;

    if (adUpdates.location !== undefined)
      updateData.location = adUpdates.location;
    if (adUpdates.address !== undefined) updateData.address = adUpdates.address;
    if (adUpdates.province !== undefined)
      updateData.province = adUpdates.province;
    if (adUpdates.district !== undefined)
      updateData.district = adUpdates.district;
    if (adUpdates.city !== undefined) updateData.city = adUpdates.city;

    if (adUpdates.metadata !== undefined || adUpdates.price !== undefined) {
      const effectivePrice = updateData.price !== undefined ? updateData.price : existingAd.price;
      const baseMetadata = {
        ...((existingAd.metadata as any) || {}),
        ...((adUpdates.metadata as any) || {}),
      };
      
      baseMetadata.isNegotiable = !effectivePrice || effectivePrice <= 0
        ? true
        : ((adUpdates.metadata as any)?.isNegotiable ?? baseMetadata.isNegotiable ?? false);

      updateData.metadata = baseMetadata;
    }

    if (adUpdates.mediaIds !== undefined && Array.isArray(adUpdates.mediaIds)) {
      await db.delete(adMedia).where(eq(adMedia.adId, existingAd.id));

      if (adUpdates.mediaIds.length > 0) {
        const mediaRelations = adUpdates.mediaIds.map(
          (mediaId: string, index: number) => ({
            adId: existingAd.id,
            mediaId: mediaId,
            order: index,
          })
        );
        await db.insert(adMedia).values(mediaRelations);
      }
    }

    const [updatedAd] = await db.update(ads)
      .set(updateData)
      .where(eq(ads.id, existingAd.id))
      .returning();

    const formattedAd = {
      ...updatedAd,
      createdAt: formatIsoDate(updatedAd.createdAt) ?? new Date().toISOString(),
      updatedAt: formatIsoDate(updatedAd.updatedAt) ?? new Date().toISOString(),
      boostExpiry: formatIsoDate(updatedAd.boostExpiry),
      featureExpiry: formatIsoDate(updatedAd.featureExpiry),
      expiryDate: formatIsoDate(updatedAd.expiryDate),
      metadata:
        typeof updatedAd.metadata === "object" ? updatedAd.metadata : null,
    };

    const isNowPendingReview =
      existingAd.status !== "PENDING_REVIEW" &&
      updatedAd.status === "PENDING_REVIEW";

    if (isNowPendingReview) {
      const emailJobs: Promise<any>[] = [];

      if (user.email) {
        emailJobs.push(
          sendAdPostedEmail({
            email: user.email,
            name: user.name || "User",
            adTitle: updatedAd.title || "",
          }).catch((emailError) => {
            console.error("[UPDATE AD] Failed to send ad posted email:", emailError);
          })
        );
      }

      emailJobs.push(
        sendNewAdSubmittedAdminEmail({
          adId: existingAd.id,
          adTitle: updatedAd.title || "",
          category: updatedAd.categoryId,
          type: updatedAd.type,
          brand: updatedAd.brand,
          model: updatedAd.model,
          price: updatedAd.price,
          city: updatedAd.city,
          district: updatedAd.district,
          sellerName: user.name || updatedAd.name || "User",
          sellerEmail: user.email || undefined,
          sellerPhone: updatedAd.phoneNumber || undefined,
          sellerWhatsapp: updatedAd.whatsappNumber || undefined,
          submittedAt: updatedAd.updatedAt,
        }).catch((emailError) => {
          console.error("[UPDATE AD] Failed to send new ad admin notification email:", emailError);
        })
      );

      await safeBackgroundJob(c, emailJobs, 3500);
    } else if (user.email && updatedAd.status === "ACTIVE") {
      const emailPromise = sendListingUpdatedEmail({
        email: user.email,
        name: user.name || "User",
        adTitle: updatedAd.title || "",
        adId: existingAd.id,
      }).catch((err) => console.error("[UPDATE AD] Failed to send update email:", err));

      await safeBackgroundJob(c, emailPromise, 3500);
    }

    return c.json(formattedAd as any, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[UPDATE AD] Error:", error);

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
