import { prisma } from "@/server/prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";

// List all favorites for the current user
export const list: any = async (c: any) => {
  const user = c.get("user");

  console.log("List favorites - User:", user?.id || "not authenticated");

  if (!user) {
    return c.json(
      { message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  try {
    // Fetch favorites with ad details
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      include: {
        ad: {
          include: {
            media: {
              include: {
                media: true, // Include the actual Media object
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Most recent first
      },
    });

    console.log("Found favorites:", favorites.length);
    if (favorites.length > 0) {
      console.log("First favorite ad media:", favorites[0]?.ad?.media);
    }
    
    // Manually fetch org for each ad to handle nullable relations
    const favoritesWithOrg = await Promise.all(
      favorites.map(async (favorite) => {
        if (favorite.ad.orgId) {
          const org = await prisma.organization.findUnique({
            where: { id: favorite.ad.orgId },
          });
          return {
            ...favorite,
            ad: {
              ...favorite.ad,
              org: org || null,
            },
          };
        }
        return {
          ...favorite,
          ad: {
            ...favorite.ad,
            org: null,
          },
        };
      })
    );

    return c.json(favoritesWithOrg, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return c.json(
      { message: "Failed to fetch favorites" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Add ad to favorites
export const create: any = async (c: any) => {
  const user = c.get("user");

  console.log("Create favorite - User:", user?.id || "not authenticated");

  if (!user) {
    return c.json(
      { message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { adId } = await c.req.valid("json");
  console.log("Create favorite - AdId:", adId);

  try {
    // Check if ad exists
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      console.log("Ad not found:", adId);
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        adId: adId,
      },
    });

    if (existing) {
      console.log("Ad already in favorites");
      return c.json(
        { message: "Ad already in favorites" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        adId: adId,
      },
    });

    console.log("Favorite created successfully:", favorite.id);
    return c.json({ success: true, id: favorite.id }, HttpStatusCodes.CREATED);
  } catch (error: any) {
    console.error("=== ERROR CREATING FAVORITE ===");
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error name:", error?.name);
    console.error("Full error:", error);
    console.error("Stack trace:", error?.stack);
    return c.json(
      { message: "Failed to add to favorites", error: error?.message || String(error) },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Remove ad from favorites
export const remove: any = async (c: any) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { adId } = c.req.valid("param");

  try {
    // Find favorite
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        adId: adId,
      },
    });

    if (!favorite) {
      return c.json(
        { message: "Favorite not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Delete favorite
    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return c.json(
      { message: "Ad removed from favorites" },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error removing favorite:", error);
    return c.json(
      { message: "Failed to remove from favorites" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Check if ad is favorited
export const check: any = async (c: any) => {
  const user = c.get("user");
  const { adId } = c.req.valid("param");

  console.log("Check favorite - User:", user?.id || "not authenticated", "AdId:", adId);

  if (!user) {
    console.log("User not authenticated, returning false");
    return c.json({ isFavorited: false }, HttpStatusCodes.OK);
  }

  try {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        adId: adId,
      },
    });

    const isFavorited = !!favorite;
    console.log("Favorite check result:", isFavorited);
    return c.json({ isFavorited }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error checking favorite:", error);
    return c.json({ isFavorited: false }, HttpStatusCodes.OK);
  }
};
