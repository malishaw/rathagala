import { z } from "@hono/zod-openapi";

// Schema for adding a favorite
export const addFavoriteSchema = z.object({
  adId: z.string().min(1, "Ad ID is required"),
});

// Schema for favorite response
export const favoriteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  adId: z.string(),
  createdAt: z.string(),
});

// Schema for list of favorites with ad details
export const favoritesListSchema = z.object({
  favorites: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      adId: z.string(),
      createdAt: z.string(),
      ad: z.any().optional(), // Ad details
    })
  ),
  total: z.number(),
});

// Schema for check response
export const checkFavoriteSchema = z.object({
  isFavorited: z.boolean(),
});
