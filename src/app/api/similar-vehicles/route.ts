export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { ads, adMedia, media } from "@/server/db/schema";
import { eq, and, not, ilike, isNotNull, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get("adId");
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "6", 10)));

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
        type: true,
        categoryId: true,
      },
    });

    if (!currentAd) {
      return NextResponse.json({ vehicles: [] });
    }

    const conditions = [
      eq(ads.status, "ACTIVE" as any),
      eq(ads.published, true),
      not(eq(ads.id, currentAd.id)),
      isNotNull(ads.price),
    ];

    if (currentAd.type) {
      conditions.push(eq(ads.type, currentAd.type as any));
    }

    if (currentAd.brand) {
      if (currentAd.model) {
        conditions.push(
          or(
            and(ilike(ads.brand, currentAd.brand), ilike(ads.model, currentAd.model)),
            ilike(ads.brand, currentAd.brand)
          )!
        );
      } else {
        conditions.push(ilike(ads.brand, currentAd.brand));
      }
    }

    const similarAds = await db.query.ads.findMany({
      where: and(...conditions),
      limit,
      orderBy: (ads, { desc }) => [desc(ads.createdAt)],
      with: {
        media: {
          with: { media: true },
          orderBy: (adMedia, { asc }) => [asc(adMedia.order)],
          limit: 1,
        },
      },
    });

    const vehicles = similarAds.map((ad) => {
      const year = ad.manufacturedYear || ad.modelYear || null;
      const title = [ad.brand, ad.model, year].filter(Boolean).join(" ") || ad.title || "Vehicle";
      const mainPhoto = ad.media?.[0]?.media?.url || "/placeholder-image.jpg";
      const location = [ad.city, ad.province].filter(Boolean).join(", ") || ad.location || "";

      return {
        id: ad.seoSlug || ad.id,
        title,
        brand: ad.brand,
        model: ad.model,
        year,
        price: ad.price,
        mileage: ad.mileage,
        fuelType: ad.fuelType,
        transmission: ad.transmission,
        condition: ad.condition,
        location,
        image: mainPhoto,
      };
    });

    return NextResponse.json(
      { vehicles },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("[SIMILAR VEHICLES API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch similar vehicles" },
      { status: 500 }
    );
  }
}
