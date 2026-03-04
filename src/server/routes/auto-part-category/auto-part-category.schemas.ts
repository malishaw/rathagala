import { z } from "zod";

export const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("100"),
  search: z.string().optional(),
  isActive: z.string().optional(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const withPaginationSchema = z.object({
  categories: z.array(categorySchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
