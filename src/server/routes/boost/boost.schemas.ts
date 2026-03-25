import { z } from "zod";

export const BoostTypeEnum = z.enum(["BUMP", "TOP_AD", "URGENT", "FEATURED"]);
export const BoostStatusEnum = z.enum(["PENDING", "ACTIVE", "EXPIRED", "REJECTED"]);

export const boostPricingSchema = z.object({
  id: z.string(),
  boostType: BoostTypeEnum,
  days: z.number(),
  price: z.number(),
  updatedAt: z.string(),
  createdAt: z.string(),
});

export const createBoostRequestSchema = z.object({
  adId: z.string().min(1, "Ad ID is required"),
  boostTypes: z.array(BoostTypeEnum).min(1).max(3, "Maximum 3 boost types"),
  bumpDays: z.number().optional(),
  topAdDays: z.number().optional(),
  urgentDays: z.number().optional(),
  featuredDays: z.number().optional(),
});

export const approveBoostSchema = z.object({
  boostRequestId: z.string().min(1),
  // Admin can override boost types and durations
  boostTypes: z.array(BoostTypeEnum).min(1).max(3).optional(),
  bumpDays: z.number().optional(),
  topAdDays: z.number().optional(),
  urgentDays: z.number().optional(),
  featuredDays: z.number().optional(),
});

export const updateBoostPricingSchema = z.object({
  prices: z.array(
    z.object({
      boostType: BoostTypeEnum,
      days: z.number(),
      price: z.number().min(0),
    })
  ),
});

export const adminPromoteSchema = z.object({
  adId: z.string().min(1, "Ad ID is required"),
  boostTypes: z.array(BoostTypeEnum).min(1).max(3, "Maximum 3 boost types"),
  bumpDays: z.number().optional(),
  topAdDays: z.number().optional(),
  urgentDays: z.number().optional(),
  featuredDays: z.number().optional(),
});

export const revenueFilterSchema = z.object({
  filter: z.enum(["today", "7days", "30days", "all"]).optional().default("all"),
});
