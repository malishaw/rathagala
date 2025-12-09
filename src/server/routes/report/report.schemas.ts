import { z } from "zod";

import { ReportSchema } from "@/types/schema-types";

export const IdParamsSchema = z.object({ id: z.string() });

export const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  status: z.string().optional(),
  adId: z.string().optional(),
  userId: z.string().optional(),
});

export type QueryParams = z.infer<typeof querySchema>;

// Format the Report schema to match API response format
const formattedReportSchema = ReportSchema.extend({
  createdAt: z.string(),
});

export const withPaginationSchema = z.object({
  reports: z.array(formattedReportSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export const selectReportSchema = formattedReportSchema;

export type SelectReportSchema = z.infer<typeof selectReportSchema>;

// Create Report Schema
export const createReportSchema = z.object({
  adId: z.string().min(1, "Ad ID is required"),
  reason: z.string().min(1, "Reason is required"),
  details: z.string().optional(),
});

export type CreateReportSchema = z.infer<typeof createReportSchema>;

// Update Report Schema (for admin/moderator actions)
export const updateReportSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED"]).optional(),
  details: z.string().optional(),
});

export type UpdateReportSchema = z.infer<typeof updateReportSchema>;

export const deleteReportSchema = IdParamsSchema;
export type DeleteReportSchema = z.infer<typeof deleteReportSchema>;

// Report reasons enum for frontend validation
export const ReportReasons = {
  SPAM: "Spam or Misleading",
  INAPPROPRIATE: "Inappropriate Content",
  FRAUD: "Fraud or Scam",
  DUPLICATE: "Duplicate Listing",
  INCORRECT_INFO: "Incorrect Information",
  OFFENSIVE: "Offensive Content",
  OTHER: "Other",
} as const;

export type ReportReason = keyof typeof ReportReasons;
