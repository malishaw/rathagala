import { z } from "zod";

export const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("200"),
  search: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.string().optional(),
  includeUserModels: z.string().optional(),
});

export const vehicleModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const withPaginationSchema = z.object({
  models: z.array(vehicleModelSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export const createVehicleModelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateVehicleModelSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  brand: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
