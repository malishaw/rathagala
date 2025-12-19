import { z } from "zod";

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(["daily", "monthly", "range"]).optional().default("monthly"),
});

export const adSummaryResponseSchema = z.object({
  totalAds: z.number(),
  approvedAds: z.number(),
  pendingAds: z.number(),
  draftAds: z.number(),
});

export const adCreationDataSchema = z.object({
  date: z.string(),
  count: z.number(),
});

export const adCreationResponseSchema = z.object({
  data: z.array(adCreationDataSchema),
});

export const adDeletionDataSchema = z.object({
  date: z.string(),
  count: z.number(),
});

export const adDeletionResponseSchema = z.object({
  data: z.array(adDeletionDataSchema),
});

export const adCreationByEntitySchema = z.object({
  name: z.string(),
  count: z.number(),
  type: z.enum(["user", "organization"]),
});

export const adCreationByEntityResponseSchema = z.object({
  data: z.array(adCreationByEntitySchema),
});

export const adAttributeCountSchema = z.object({
  value: z.string(),
  count: z.number(),
});

export const adAdvancedSummaryResponseSchema = z.object({
  adTypes: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  listingTypes: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  brands: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  models: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  manufacturedYears: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  conditions: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  transmissions: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  fuelTypes: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  provinces: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  districts: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
  cities: z.object({
    total: z.array(adAttributeCountSchema),
    top10: z.array(adAttributeCountSchema),
  }),
});

export const userSummaryResponseSchema = z.object({
  totalUsers: z.number(),
  totalAgents: z.number(),
  totalOrganizations: z.number(),
  top10Users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      adsCount: z.number(),
    })
  ),
  top10Organizations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      adsCount: z.number(),
      membersCount: z.number(),
    })
  ),
});
