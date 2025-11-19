import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { AdStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get("adId");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!adId) {
      return NextResponse.json(
        { error: "Ad ID is required" },
        { status: 400 }
      );
    }

    // Fetch the current ad
    const currentAd = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!currentAd) {
      return NextResponse.json(
        { error: "Ad not found" },
        { status: 404 }
      );
    }

    // Build query to find similar vehicles
    const baseConditions: any = {
      status: AdStatus.ACTIVE,
      listingType: "SELL",
      id: { not: adId }, // Exclude current ad
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

    // Match by year (within ±3 years)
    if (currentAd.manufacturedYear) {
      const year = parseInt(currentAd.manufacturedYear);
      if (!isNaN(year)) {
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

    // Find similar ads with full details
    const similarAds = await prisma.ad.findMany({
      where: whereConditions,
      select: {
        id: true,
        brand: true,
        model: true,
        manufacturedYear: true,
        price: true,
        mileage: true,
        fuelType: true,
        transmission: true,
        condition: true,
        city: true,
        province: true,
        media: {
          select: {
            media: {
              select: {
                url: true,
              },
            },
          },
          take: 1,
        },
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (similarAds.length === 0) {
      // Try broader search (just type and brand)
      const broaderWhereConditions: any = {
        status: AdStatus.ACTIVE,
        listingType: "SELL",
        id: { not: adId },
        price: { not: null },
        type: currentAd.type,
      };

      if (currentAd.brand) {
        broaderWhereConditions.brand = { contains: currentAd.brand, mode: "insensitive" };
      }

      const broaderSimilarAds = await prisma.ad.findMany({
        where: broaderWhereConditions,
        select: {
          id: true,
          brand: true,
          model: true,
          manufacturedYear: true,
          price: true,
          mileage: true,
          fuelType: true,
          transmission: true,
          condition: true,
          city: true,
          province: true,
          media: {
            select: {
              media: {
                select: {
                  url: true,
                },
              },
            },
            take: 1,
          },
        },
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        vehicles: broaderSimilarAds.map((ad) => ({
          id: ad.id,
          title: [ad.brand, ad.model, ad.manufacturedYear].filter(Boolean).join(" "),
          brand: ad.brand,
          model: ad.model,
          year: ad.manufacturedYear,
          price: ad.price,
          mileage: ad.mileage,
          fuelType: ad.fuelType,
          transmission: ad.transmission,
          condition: ad.condition,
          location: [ad.city, ad.province].filter(Boolean).join(", "),
          image: ad.media?.[0]?.media?.url || "/placeholder.svg?height=200&width=300",
        })),
      });
    }

    return NextResponse.json({
      vehicles: similarAds.map((ad) => ({
        id: ad.id,
        title: [ad.brand, ad.model, ad.manufacturedYear].filter(Boolean).join(" "),
        brand: ad.brand,
        model: ad.model,
        year: ad.manufacturedYear,
        price: ad.price,
        mileage: ad.mileage,
        fuelType: ad.fuelType,
        transmission: ad.transmission,
        condition: ad.condition,
        location: [ad.city, ad.province].filter(Boolean).join(", "),
        image: ad.media?.[0]?.media?.url || "/placeholder.svg?height=200&width=300",
      })),
    });
  } catch (error) {
    console.error("Error fetching similar vehicles:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Error fetching similar vehicles",
      },
      { status: 500 }
    );
  }
}

