import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/prisma/client";
import { sendAdTwoWeekNotification } from "@/lib/email";
import { headers } from "next/headers";

/**
 * POST /api/check-ad-notifications
 *
 * Called silently from the profile page on load.
 * Finds the current user's active ads whose createdAt is 14+ days ago
 * and that haven't received the 2-week notification yet.
 * Uses the existing `metadata` JSON field to track sent status — no schema change.
 */
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Find this user's published active ads last updated 14+ days ago
    const ads = await prisma.ad.findMany({
      where: {
        createdBy: session.user.id,
        published: true,
        status: "ACTIVE",
        updatedAt: { lte: twoWeeksAgo },
      },
      select: {
        id: true,
        title: true,
        metadata: true,
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    let sent = 0;

    for (const ad of ads) {
      const metadata = (ad.metadata as Record<string, unknown>) ?? {};

      // Skip if we already sent the 2-week email
      if (metadata.twoWeekEmailSent) continue;

      if (!ad.creator?.email) continue;

      try {
        await sendAdTwoWeekNotification({
          email: ad.creator.email,
          name: ad.creator.name ?? "User",
          adTitle: ad.title,
          adId: ad.id,
        });

        // Mark as sent in metadata so it won't be sent again
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            metadata: {
              ...metadata,
              twoWeekEmailSent: true,
              twoWeekEmailSentAt: new Date().toISOString(),
            },
          },
        });

        sent++;
      } catch (err) {
        console.error(`[check-ad-notifications] Failed to send for ad ${ad.id}:`, err);
      }
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error("[check-ad-notifications] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
