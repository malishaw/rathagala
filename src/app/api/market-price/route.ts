import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { AdStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get("adId");

    if (!adId) {
      return NextResponse.json(
        { error: "Ad ID is required" },
        { status: 400 }
      );
    }

    // Detect whether the identifier is a MongoDB ObjectId (24 hex chars) or a seoSlug
    const isObjectId = /^[a-f\d]{24}$/i.test(adId);
    const whereClause = isObjectId ? { id: adId } : { seoSlug: adId };

    // Fetch the current ad
    const currentAd = await prisma.ad.findUnique({
      where: whereClause,
    });

    if (!currentAd) {
      return NextResponse.json(
        { error: "Ad not found" },
        { status: 404 }
      );
    }

    // If the ad doesn't have a price, we can't compare
    if (!currentAd.price) {
      return NextResponse.json({
        currentPrice: null,
        marketPrice: null,
        priceDifference: null,
        priceDifferencePercent: null,
        similarAdsCount: 0,
        message: "No price available for comparison",
      });
    }

    // Build query to find similar vehicles
    const baseConditions: any = {
      status: AdStatus.ACTIVE,
      listingType: "SELL",
      id: { not: currentAd.id }, // Exclude current ad
      price: { not: null }, // Only ads with prices
    };

    // Match by type
    if (currentAd.type) {
      baseConditions.type = currentAd.type;
    }

    // Build AND conditions for brand and model matching
    const andConditions: any[] = [];
    
    // Match by brand and model if available (case-insensitive)
    if (currentAd.brand && currentAd.model) {
      andConditions.push(
        { brand: { contains: currentAd.brand, mode: "insensitive" } },
        { model: { contains: currentAd.model, mode: "insensitive" } }
      );
    } else if (currentAd.brand) {
      andConditions.push({ brand: { contains: currentAd.brand, mode: "insensitive" } });
    }

    // Combine base conditions with AND conditions
    const whereConditions: any = { ...baseConditions };
    if (andConditions.length > 0) {
      whereConditions.AND = andConditions;
    }

    // Match by year (within ±3 years, or remove year restriction for very new models)
    if (currentAd.manufacturedYear) {
      const year = parseInt(currentAd.manufacturedYear);
      if (!isNaN(year)) {
        // For very new models (2024+), be more flexible with year matching
        if (year >= 2024) {
          // Include current year and previous years
          const yearOptions = [
            year.toString(),
            (year - 1).toString(),
            (year - 2).toString(),
          ];
          whereConditions.manufacturedYear = { in: yearOptions };
        } else {
          // For older models, match within ±3 years
          const yearOptions = [
            year.toString(),
            (year - 1).toString(),
            (year + 1).toString(),
            (year - 2).toString(),
            (year + 2).toString(),
            (year - 3).toString(),
            (year + 3).toString(),
          ];
          whereConditions.manufacturedYear = { in: yearOptions };
        }
      }
    } else if (currentAd.modelYear) {
      const year = parseInt(currentAd.modelYear);
      if (!isNaN(year)) {
        if (year >= 2024) {
          const yearOptions = [
            year.toString(),
            (year - 1).toString(),
            (year - 2).toString(),
          ];
          whereConditions.modelYear = { in: yearOptions };
        } else {
          const yearOptions = [
            year.toString(),
            (year - 1).toString(),
            (year + 1).toString(),
            (year - 2).toString(),
            (year + 2).toString(),
            (year - 3).toString(),
            (year + 3).toString(),
          ];
          whereConditions.modelYear = { in: yearOptions };
        }
      }
    }

    // Don't require fuel type and transmission for matching (too restrictive)
    // These can be used as additional filters but not required

    // Find similar ads
    const similarAds = await prisma.ad.findMany({
      where: whereConditions,
      select: {
        price: true,
        mileage: true,
        manufacturedYear: true,
        modelYear: true,
        condition: true,
      },
      take: 50, // Limit to 50 similar ads for calculation
    });

    if (similarAds.length === 0) {
      return NextResponse.json({
        currentPrice: currentAd.price,
        marketPrice: null,
        priceDifference: null,
        priceDifferencePercent: null,
        similarAdsCount: 0,
        message: "Not enough similar vehicles (matching brand, model, and year range) in the market to provide a reliable price analysis.",
      });
    }

    // Calculate market price from similar ads
    const prices = similarAds
      .map((ad) => ad.price)
      .filter((price): price is number => price !== null && price > 0);

    if (prices.length === 0) {
      return NextResponse.json({
        currentPrice: currentAd.price,
        marketPrice: null,
        priceDifference: null,
        priceDifferencePercent: null,
        similarAdsCount: 0,
        message: "Not enough similar vehicles (matching brand, model, and year range) with valid prices to provide a reliable analysis.",
      });
    }

    // Calculate average market price
    const marketPrice = Math.round(
      prices.reduce((sum, price) => sum + price, 0) / prices.length
    );

    const priceDifference = currentAd.price - marketPrice;
    const priceDifferencePercent = Math.round(
      (priceDifference / marketPrice) * 100
    );

    return NextResponse.json({
      currentPrice: currentAd.price,
      marketPrice,
      priceDifference,
      priceDifferencePercent,
      similarAdsCount: similarAds.length,
      message: "Based on average of matching brand, model, and year range",
    });
  } catch (error) {
    console.error("Error fetching market price:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Error fetching market price",
      },
      { status: 500 }
    );
  }
}

