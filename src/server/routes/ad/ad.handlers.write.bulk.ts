import { db } from "@/server/db";
import { ads, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import type { AppRouteHandler } from "@/types/server";
import type { BulkCreateRoute } from "./ad.routes";

export const bulkCreate: AppRouteHandler<BulkCreateRoute> = async (c) => {
  try {
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: HttpStatusPhrases.UNAUTHORIZED },
        HttpStatusCodes.UNAUTHORIZED
      ) as any;
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });

    if (!dbUser || dbUser.role !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      ) as any;
    }

    const { ads: newAds } = c.req.valid("json");
    let createdCount = 0;

    for (const adDetails of newAds) {
      const seller = await db.query.users.findFirst({
        where: eq(users.email, adDetails.sellerEmail),
        columns: { id: true },
      });

      if (!seller) {
        console.warn(`[BULK CREATE] Seller not found for email: ${adDetails.sellerEmail}`);
        continue;
      }

      let seoSlug = adDetails.title
        ? adDetails.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : `vehicle-${Date.now()}`;
      seoSlug += `-${Math.random().toString(36).substring(2, 8)}`;

      await db.insert(ads).values({
        orgId: "",
        createdBy: seller.id,
        title: adDetails.title || "",
        description: adDetails.description || "",
        type: (adDetails.type as any) || "CAR",
        listingType: (adDetails.listingType as any) || "SELL",
        status: "PENDING_REVIEW",
        seoSlug,
        published: false,
        isDraft: false,
        boosted: false,
        featured: false,
        price: adDetails.price || null,
        condition: adDetails.condition || null,
        brand: adDetails.brand || null,
        model: adDetails.model || null,
        trimEdition: adDetails.trimEdition || null,
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
        maintenanceType: adDetails.maintenanceType || null,
        phoneNumber: adDetails.phoneNumber || null,
        whatsappNumber: adDetails.whatsappNumber || null,
        location: adDetails.location || null,
        address: adDetails.address || null,
        province: adDetails.province || null,
        district: adDetails.district || null,
        city: adDetails.city || null,
        specialNote: adDetails.specialNote || null,
        metadata: adDetails.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createdCount++;
    }

    return c.json(
      { message: `Successfully created ${createdCount} ads`, count: createdCount },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[BULK CREATE ADS] Error:", error);
    return c.json(
      { message: error.message || "Failed to bulk create ads" },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    ) as any;
  }
};
