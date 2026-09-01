export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { ads } from "@/server/db/schema";
import { eq, and, not, ilike, isNotNull, sql, avg, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get("adId");

    if (!adId) {
      return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adId);
    const targetCondition = isUuid ? eq(ads.id, adId) : eq(ads.seoSlug, adId);

    const currentAd = await db.query.ads.findFirst({
      where: targetCondition,
      columns: {
        id: true,
        brand: true,
        model: true,
        price: true,
        type: true,
        manufacturedYear: true,
        modelYear: true,
      },
    });

    if (!currentAd) {
      return NextResponse.json({
        currentPrice: null,
        marketPrice: null,
        priceDifference: null,
        priceDifferencePercent: null,
        similarAdsCount: 0,
        message: "Ad not found",
      });
    }

    const currentPrice = currentAd.price ?? null;
    const conditions = [
      eq(ads.status, "ACTIVE" as any),
      eq(ads.published, true),
      not(eq(ads.id, currentAd.id)),
      isNotNull(ads.price),
    ];

    if (currentAd.type) conditions.push(eq(ads.type, currentAd.type as any));
    if (currentAd.brand) conditions.push(ilike(ads.brand, currentAd.brand));
    if (currentAd.model) conditions.push(ilike(ads.model, currentAd.model));

    const stats = await db
      .select({
        avgPrice: avg(ads.price),
        totalCount: count(),
      })
      .from(ads)
      .where(and(...conditions));

    const avgVal = stats?.[0]?.avgPrice ? Math.round(Number(stats[0].avgPrice)) : null;
    const similarCount = stats?.[0]?.totalCount ?? 0;

    let priceDiff: number | null = null;
    let priceDiffPct: number | null = null;
    let message: string | null = null;

    if (currentPrice && avgVal) {
      priceDiff = currentPrice - avgVal;
      priceDiffPct = Math.round(((currentPrice - avgVal) / avgVal) * 100);
      if (priceDiffPct < -5) {
        message = `Priced ${Math.abs(priceDiffPct)}% below market average`;
      } else if (priceDiffPct > 5) {
        message = `Priced ${priceDiffPct}% above market average`;
      } else {
        message = "Priced close to market average";
      }
    }

    return NextResponse.json(
      {
        currentPrice,
        marketPrice: avgVal,
        priceDifference: priceDiff,
        priceDifferencePercent: priceDiffPct,
        similarAdsCount: similarCount,
        message,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("[MARKET PRICE API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate market price" },
      { status: 500 }
    );
  }
}
