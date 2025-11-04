import { z } from "zod";

export const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const withPaginationSchema = z.object({
  users: z.array(z.any()),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

