export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ads } from "@/server/db/schema";
import { and, eq, gte, lte, not } from "drizzle-orm";
import { sendListingExpiryReminderEmail } from "@/lib/email";

export async function POST() {
  try {
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
          console.error(`[CHECK AD NOTIFICATIONS] Failed for ad ${ad.id}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("[CHECK AD NOTIFICATIONS] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready" });
}
