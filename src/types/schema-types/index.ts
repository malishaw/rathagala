import { z } from "zod";

// Helper JSON Schema
export type NullableJsonInput = any;

export const JsonValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal("DbNull"), z.literal("JsonNull")])
  .nullable();

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

// ENUMS
export const AdTypeSchema = z.enum([
  "CAR",
  "VAN",
  "MOTORCYCLE",
  "BICYCLE",
  "THREE_WHEEL",
  "BUS",
  "LORRY",
  "HEAVY_DUTY",
  "TRACTOR",
  "AUTO_SERVICE",
  "RENTAL",
  "AUTO_PARTS",
  "MAINTENANCE",
  "BOAT",
]);
export type AdTypeType = `${z.infer<typeof AdTypeSchema>}`;

export const ListingTypeSchema = z.enum(["SELL", "WANT", "RENT", "HIRE"]);
export type ListingTypeType = `${z.infer<typeof ListingTypeSchema>}`;

export const MediaTypeSchema = z.enum(["IMAGE", "VIDEO", "PDF", "OTHER"]);
export type MediaTypeType = `${z.infer<typeof MediaTypeSchema>}`;

export const PaymentTypeSchema = z.enum(["BOOST", "FEATURE"]);
export type PaymentTypeType = `${z.infer<typeof PaymentTypeSchema>}`;

export const BoostTypeSchema = z.enum(["BUMP", "TOP_AD", "URGENT", "FEATURED"]);
export type BoostTypeType = `${z.infer<typeof BoostTypeSchema>}`;

export const BoostStatusSchema = z.enum(["PENDING", "ACTIVE", "EXPIRED", "REJECTED"]);
export type BoostStatusType = `${z.infer<typeof BoostStatusSchema>}`;

export const PaymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]);
export type PaymentStatusType = `${z.infer<typeof PaymentStatusSchema>}`;

export const AdStatusSchema = z.enum(["ACTIVE", "EXPIRED", "DRAFT", "PENDING_REVIEW", "REJECTED"]);
export type AdStatusType = `${z.infer<typeof AdStatusSchema>}`;

export const NotificationTypeSchema = z.enum(["AD_EXPIRED", "AD_FEATURED", "MESSAGE", "REFERRAL", "REVIEW"]);
export type NotificationTypeType = `${z.infer<typeof NotificationTypeSchema>}`;

export const SharePlatformSchema = z.enum(["FACEBOOK", "TWITTER", "WHATSAPP", "LINKEDIN", "COPY_LINK"]);
export type SharePlatformType = `${z.infer<typeof SharePlatformSchema>}`;

export const FuelTypeSchema = z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "GAS"]);
export type FuelTypeType = `${z.infer<typeof FuelTypeSchema>}`;

export const TransmissionSchema = z.enum(["MANUAL", "AUTOMATIC", "CVT"]);
export type TransmissionType = `${z.infer<typeof TransmissionSchema>}`;

export const BodyTypeSchema = z.enum(["SALOON", "HATCHBACK", "STATION_WAGON", "SUV"]);
export type BodyTypeType = `${z.infer<typeof BodyTypeSchema>}`;

export const BikeTypeSchema = z.enum(["SCOOTER", "E_BIKE", "MOTORBIKES", "QUADRICYCLES"]);
export type BikeTypeType = `${z.infer<typeof BikeTypeSchema>}`;

export const HeavyDutyVehicleTypeSchema = z.enum([
  "BED_TRAILER",
  "BOWSER",
  "BULLDOZER",
  "CRANE",
  "DUMP_TRUCK",
  "EXCAVATOR",
  "LOADER",
  "OTHER",
]);
export type HeavyDutyVehicleTypeType = `${z.infer<typeof HeavyDutyVehicleTypeSchema>}`;

// SCHEMAS & TYPES
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  twoFactorEnabled: z.boolean().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  organizationId: z.string().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  logo: z.string().nullable(),
  createdAt: z.coerce.date(),
  metadata: z.string().nullable(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.coerce.date(),
});
export type Member = z.infer<typeof MemberSchema>;

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  status: z.string(),
  expiresAt: z.coerce.date(),
  inviterId: z.string(),
});
export type Invitation = z.infer<typeof InvitationSchema>;

export const TasksSchema = z.object({
  id: z.string(),
  name: z.string(),
  done: z.boolean(),
});
export type Tasks = z.infer<typeof TasksSchema>;

export const TasksCreateInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  done: z.boolean().optional(),
});

export const AdSchema = z.object({
  type: AdTypeSchema,
  listingType: ListingTypeSchema,
  status: AdStatusSchema,
  fuelType: FuelTypeSchema.nullable(),
  transmission: TransmissionSchema.nullable(),
  bodyType: BodyTypeSchema.nullable(),
  bikeType: BikeTypeSchema.nullable(),
  vehicleType: HeavyDutyVehicleTypeSchema.nullable(),
  boostTypes: BoostTypeSchema.array(),
  boostStatus: BoostStatusSchema.nullable(),
  id: z.string(),
  orgId: z.string(),
  createdBy: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().nullable(),
  published: z.boolean(),
  isDraft: z.boolean(),
  boosted: z.boolean(),
  featured: z.boolean(),
  boostExpiry: z.coerce.date().nullable(),
  featureExpiry: z.coerce.date().nullable(),
  expiryDate: z.coerce.date().nullable(),
  rejectionDescription: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoSlug: z.string().nullable(),
  categoryId: z.string().nullable(),
  tags: z.string().array(),
  condition: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  grade: z.string().nullable(),
  trimEdition: z.string().nullable(),
  color: z.string().nullable().optional(),
  manufacturedYear: z.string().nullable(),
  modelYear: z.string().nullable(),
  mileage: z.number().nullable(),
  engineCapacity: z.number().nullable(),
  serviceType: z.string().nullable(),
  partType: z.string().nullable(),
  partName: z.string().nullable(),
  partCategoryId: z.string().nullable(),
  compatibleVehicleType: z.string().nullable(),
  maintenanceType: z.string().nullable(),
  name: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
  termsAndConditions: z.boolean().nullable(),
  location: z.string().nullable(),
  address: z.string().nullable(),
  province: z.string().nullable(),
  district: z.string().nullable(),
  city: z.string().nullable(),
  specialNote: z.string().nullable(),
  metadata: JsonValueSchema.nullable(),
  bumpActive: z.boolean(),
  topAdActive: z.boolean(),
  urgentActive: z.boolean(),
  featuredActive: z.boolean(),
  boostRequestedAt: z.coerce.date().nullable(),
  boostStartAt: z.coerce.date().nullable(),
  boostEndAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Ad = z.infer<typeof AdSchema>;

export const MediaSchema = z.object({
  type: MediaTypeSchema,
  id: z.string(),
  uploaderId: z.string(),
  url: z.string(),
  filename: z.string().nullable(),
  size: z.number().int().nullable(),
  createdAt: z.coerce.date(),
});
export type Media = z.infer<typeof MediaSchema>;

export const ReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  adId: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: z.string(),
  createdAt: z.coerce.date(),
});
export type Report = z.infer<typeof ReportSchema>;