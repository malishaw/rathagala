import { z } from "zod";

export const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("200"),
  search: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.string().optional(),
  includeUserGrades: z.string().optional(),
});

export const vehicleGradeSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string().nullable(),
  brand: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const withPaginationSchema = z.object({
  grades: z.array(vehicleGradeSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export const createVehicleGradeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  model: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateVehicleGradeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  model: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
