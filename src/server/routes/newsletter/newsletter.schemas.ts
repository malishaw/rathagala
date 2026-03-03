import { z } from "zod";

export const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
});

export type QueryParams = z.infer<typeof querySchema>;

export const sendNewsletterSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "Email content is required"),
  plainContent: z.string().optional(),
  recipientEmails: z.array(z.string().email()).min(1, "At least one recipient is required"),
});

export type SendNewsletterInput = z.infer<typeof sendNewsletterSchema>;

export const newsletterResponseSchema = z.object({
  id: z.string(),
  subject: z.string(),
  htmlContent: z.string(),
  plainContent: z.string().nullable(),
  recipientCount: z.number(),
  recipientEmails: z.array(z.string()),
  sentBy: z.string(),
  sentAt: z.string(),
  createdAt: z.string(),
});

export const withPaginationSchema = z.object({
  newsletters: z.array(newsletterResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});
