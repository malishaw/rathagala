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
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
});

export const updateUserByAdminSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  role: z.enum(["user", "admin"]).optional(),
  organizationId: z.string().nullable().optional(),
  phone: z.string().optional(),
  phoneVerified: z.enum(["verified", "not_verified", "rejected"]).nullable().optional(),
  whatsappNumber: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
});

export const assignOrganizationSchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
});

export const bulkCreateUserSchema = z.object({
  users: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    role: z.enum(["user", "admin"]).optional().default("user"),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    location: z.string().optional(),
    organization: z.string().optional(), // Organization name to lookup
    mediaIds: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  })),
});


