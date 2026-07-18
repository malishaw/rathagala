import { db } from "@/server/db";
import { ads, users, adAnalytics } from "@/server/db/schema";
import { eq, and, gte, lte, not } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import type { AppRouteHandler } from "@/types/server";
import type { ApproveRoute, RejectRoute, IncrementViewRoute, RenewRoute, SendExpiryRemindersRoute } from "./ad.routes";
import { sendAdApprovalEmail, sendListingRenewalConfirmationEmail, sendListingExpiryReminderEmail } from "@/lib/email";

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

    const userRole = (user as any)?.role;
    if (userRole !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const [updatedAd] = await db.update(ads).set({
      status: "ACTIVE" as any,
      published: true,
      isDraft: false,
    }).where(eq(ads.id, adId)).returning();

    try {
      if (existingAd.user?.email && existingAd.user?.name) {
        await sendAdApprovalEmail({
          email: existingAd.user.email,
          name: existingAd.user.name,
          adTitle: existingAd.title || "",
          adId: adId,
        });
      }
    } catch (emailError) {
      console.error("[APPROVE AD] Failed to send approval email:", emailError);
    }

    const formattedAd = {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
      boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
      expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
    };

    return c.json(formattedAd as any, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[APPROVE AD] Error:", error);
    return c.json(
      { message: error.message || "Failed to approve ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

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

    const userRole = (user as any)?.role;
    if (userRole !== "admin") {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
      with: { user: true },
    });

    if (!existingAd) {
      return c.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const body = c.req.valid("json");

    const [updatedAd] = await db.update(ads).set({
      status: "REJECTED" as any,
      published: false,
      rejectionDescription: body?.rejectionDescription || null,
    }).where(eq(ads.id, adId)).returning();

    try {
      const { sendAdRejectionEmail } = await import("@/lib/email");
      if (existingAd.user?.email) {
        await sendAdRejectionEmail({
          email: existingAd.user.email,
          name: existingAd.user.name || "User",
          adTitle: existingAd.title || "",
          rejectionReason: body?.rejectionDescription,
        });
      }
    } catch (emailError) {
      console.error("[REJECT AD] Failed to send rejection email:", emailError);
    }

    const formattedAd = {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
      boostExpiry: updatedAd.boostExpiry?.toISOString() ?? null,
      featureExpiry: updatedAd.featureExpiry?.toISOString() ?? null,
      expiryDate: updatedAd.expiryDate?.toISOString() ?? null,
    };

    return c.json(formattedAd as any, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[REJECT AD] Error:", error);
    return c.json(
      { message: error.message || "Failed to reject ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const incrementView: AppRouteHandler<IncrementViewRoute> = async (c) => {
  try {
    const { id } = c.req.param();

    const ad = await db.query.ads.findFirst({
      where: eq(ads.id, id),
      columns: { id: true, status: true },
    });

    if (!ad) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    if (ad.status !== "ACTIVE") {
      return c.json(
        { success: false, views: 0 },
        HttpStatusCodes.OK
      );
    }

    const existingAnalytics = await db.query.adAnalytics.findFirst({
      where: eq(adAnalytics.adId, id),
    });

    let newViews = 1;
    if (existingAnalytics) {
      const [updated] = await db.update(adAnalytics)
        .set({ views: (existingAnalytics.views ?? 0) + 1 })
        .where(eq(adAnalytics.adId, id))
        .returning();
      newViews = updated.views ?? 1;
    } else {
      const [inserted] = await db.insert(adAnalytics)
        .values({
          adId: id,
          views: 1,
          clicks: 0,
          impressions: 0,
        })
        .returning();
      newViews = inserted.views ?? 1;
    }

    return c.json(
      {
        success: true,
        views: newViews,
      },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[INCREMENT VIEW] Error:", error);
    return c.json(
      { message: error.message || "Failed to increment view count" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const renew: AppRouteHandler<RenewRoute> = async (c) => {
  try {
    const adId = c.req.valid("param").id;
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
      with: {
        user: { columns: { id: true, name: true, email: true } },
      },
    });

    if (!existingAd) {
      return c.json({ message: "Ad not found" }, HttpStatusCodes.NOT_FOUND);
    }

    const isAdmin = (user as any)?.role === "admin";
    if (existingAd.createdBy !== user.id && !isAdmin) {
      return c.json({ message: "Forbidden" }, HttpStatusCodes.FORBIDDEN);
    }

    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 60);

    const [renewedAd] = await db.update(ads).set({
      createdAt: new Date(),
      expiryDate: newExpiryDate,
      status: "ACTIVE" as any,
      published: true,
      isDraft: false,
      updatedAt: new Date(),
    }).where(eq(ads.id, adId)).returning();

    if (existingAd.user?.email) {
      sendListingRenewalConfirmationEmail({
        email: existingAd.user.email,
        name: existingAd.user.name || "User",
        adTitle: existingAd.title || "",
        adId: adId,
        newExpiryDate,
      }).catch((err) => console.error("[RENEW AD] Failed to send renewal email:", err));
    }

    return c.json(
      {
        message: "Ad renewed successfully",
        expiryDate: renewedAd.expiryDate?.toISOString() ?? newExpiryDate.toISOString(),
      },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[RENEW AD] Error:", error);
    return c.json(
      { message: error.message || "Failed to renew ad" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const sendExpiryReminders: AppRouteHandler<SendExpiryRemindersRoute> = async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const start = new Date();
  start.setDate(start.getDate() - 59);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const fetchedAds = await db.query.ads.findMany({
    where: and(
      eq(ads.status, "ACTIVE" as any),
      eq(ads.published, true),
      not(eq(ads.boostStatus, "ACTIVE" as any)),
      gte(ads.createdAt, start),
      lte(ads.createdAt, end)
    ),
    with: {
      user: { columns: { name: true, email: true } },
    },
  });

  let count = 0;
  for (const ad of fetchedAds) {
    if (ad.user?.email) {
      try {
        await sendListingExpiryReminderEmail({
          email: ad.user.email,
          name: ad.user.name || "User",
          adTitle: ad.title || "",
          adId: ad.id,
        });
        count++;
      } catch (err) {
        console.error(`[EXPIRY REMINDERS] Failed for ad ${ad.id}:`, err);
      }
    }
  }

  return c.json({ message: "Expiry reminders sent", count }, HttpStatusCodes.OK);
};
