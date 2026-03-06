import { z } from "zod";

export const createBrandCarouselSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  imageUrl: z.string().min(1, "Image is required"), // Accept both URLs and data URLs
  order: z.number().int().optional().default(0),
});

export type CreateBrandCarouselInput = z.infer<typeof createBrandCarouselSchema>;

export const updateBrandCarouselSchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(), // Accept both URLs and data URLs
  order: z.number().int().optional(),
});

export type UpdateBrandCarouselInput = z.infer<typeof updateBrandCarouselSchema>;

export const brandCarouselResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listBrandCarouselResponseSchema = z.object({
  brands: z.array(brandCarouselResponseSchema),
});
