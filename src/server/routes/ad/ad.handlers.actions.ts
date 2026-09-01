import { db } from "@/server/db";
import { ads, users, adAnalytics } from "@/server/db/schema";
import { eq, and, gte, lte, not, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { formatIsoDate } from "@/server/helpers/date-utils";
import { safeBackgroundJob } from "@/server/helpers/execution-context";
import type { AppRouteHandler } from "@/types/server";
import type { ApproveRoute, RejectRoute, IncrementViewRoute, RenewRoute, SendExpiryRemindersRoute } from "./ad.routes";
import { sendAdApprovalEmail, sendAdRejectionEmail, sendListingRenewalConfirmationEmail, sendListingExpiryReminderEmail } from "@/lib/email";

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

    const isAdmin = (user as any)?.role === "admin";
    if (!isAdmin) {
      return c.json(
        { message: HttpStatusPhrases.FORBIDDEN },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!existingAd) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60);

    const [updatedAd] = await db.update(ads)
      .set({
        status: "ACTIVE" as any,
        published: true,
        isDraft: false,
        rejectionDescription: null,
        expiryDate,
        updatedAt: new Date(),
      })
      .where(eq(ads.id, adId))
      .returning();

    let sellerEmail = existingAd.user?.email;
    let sellerName = existingAd.user?.name || existingAd.name || "User";

    if (!sellerEmail && existingAd.createdBy) {
      const creator = await db.query.users.findFirst({
        where: eq(users.id, existingAd.createdBy),
        columns: { email: true, name: true },
      });
      if (creator?.email) {
        sellerEmail = creator.email;
        if (creator.name) sellerName = creator.name;
      }
    }

    if (sellerEmail) {
      const emailPromise = sendAdApprovalEmail({
        email: sellerEmail,
        name: sellerName,
        adTitle: existingAd.title || "Vehicle Listing",
        adId: adId,
      }).catch((emailError) => {
        console.error("[APPROVE AD] Failed to send approval email:", emailError);
      });

      await safeBackgroundJob(c, emailPromise, 3500);
    }

    const formattedAd = {
      ...updatedAd,
      createdAt: formatIsoDate(updatedAd.createdAt) ?? new Date().toISOString(),
      updatedAt: formatIsoDate(updatedAd.updatedAt) ?? new Date().toISOString(),
      boostExpiry: formatIsoDate(updatedAd.boostExpiry),
      featureExpiry: formatIsoDate(updatedAd.featureExpiry),
      expiryDate: formatIsoDate(updatedAd.expiryDate),
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

    const isAdmin = (user as any)?.role === "admin";
    if (!isAdmin) {
      return c.json(
        { message: HttpStatusPhrases.FORBIDDEN },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const existingAd = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!existingAd) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const body = await c.req.json().catch(() => ({}));
    const rejectionReason = (body.rejectionDescription || body.rejectionReason || "").trim();

    const [updatedAd] = await db.update(ads)
      .set({
        status: "REJECTED" as any,
        published: false,
        rejectionDescription: rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(ads.id, adId))
      .returning();

    // Send rejection notification email if seller has an email
    let sellerEmail = existingAd.user?.email;
    let sellerName = existingAd.user?.name || existingAd.name || "User";

    if (!sellerEmail && existingAd.createdBy) {
      const creator = await db.query.users.findFirst({
        where: eq(users.id, existingAd.createdBy),
        columns: { email: true, name: true },
      });
      if (creator?.email) {
        sellerEmail = creator.email;
        if (creator.name) sellerName = creator.name;
      }
    }

    if (sellerEmail) {
      const emailPromise = sendAdRejectionEmail({
        email: sellerEmail,
        name: sellerName,
        adTitle: existingAd.title || "Vehicle Listing",
        rejectionReason: rejectionReason || undefined,
      }).catch((emailError) => {
        console.error("[REJECT AD] Failed to send rejection email:", emailError);
      });

      await safeBackgroundJob(c, emailPromise, 3500);
    }

    const formattedAd = {
      ...updatedAd,
      createdAt: formatIsoDate(updatedAd.createdAt) ?? new Date().toISOString(),
      updatedAt: formatIsoDate(updatedAd.updatedAt) ?? new Date().toISOString(),
      boostExpiry: formatIsoDate(updatedAd.boostExpiry),
      featureExpiry: formatIsoDate(updatedAd.featureExpiry),
      expiryDate: formatIsoDate(updatedAd.expiryDate),
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

    // Atomic upsert: 1 single DB query instead of 3 sequential round-trips
    const [result] = await db
      .insert(adAnalytics)
      .values({
        adId: id,
        views: 1,
        clicks: 0,
        impressions: 0,
      })
      .onConflictDoUpdate({
        target: adAnalytics.adId,
        set: {
          views: sql`coalesce(${adAnalytics.views}, 0) + 1`,
        },
      })
      .returning({ views: adAnalytics.views });

    return c.json(
      {
        success: true,
        views: result?.views ?? 1,
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
      const emailPromise = sendListingRenewalConfirmationEmail({
        email: existingAd.user.email,
        name: existingAd.user.name || "User",
        adTitle: existingAd.title || "",
        adId: adId,
        newExpiryDate,
      }).catch((err) => console.error("[RENEW AD] Failed to send renewal email:", err));

      await safeBackgroundJob(c, emailPromise, 3500);
    }

    return c.json(
      {
        message: "Ad renewed successfully",
        expiryDate: formatIsoDate(renewedAd.expiryDate) ?? newExpiryDate.toISOString(),
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
    limit: 25,
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
