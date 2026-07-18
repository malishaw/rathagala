import { pgTable, text, timestamp, boolean, pgEnum, integer, doublePrecision, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


// ==========================================
// ENUMS
// ==========================================
export const adTypeEnum = pgEnum("ad_type", ["CAR", "VAN", "MOTORCYCLE", "BICYCLE", "THREE_WHEEL", "BUS", "LORRY", "HEAVY_DUTY", "TRACTOR", "AUTO_SERVICE", "RENTAL", "AUTO_PARTS", "MAINTENANCE", "BOAT"]);
export const listingTypeEnum = pgEnum("listing_type", ["SELL", "WANT", "RENT", "HIRE"]);
export const mediaTypeEnum = pgEnum("media_type", ["IMAGE", "VIDEO", "PDF", "OTHER"]);
export const paymentTypeEnum = pgEnum("payment_type", ["BOOST", "FEATURE"]);
export const boostTypeEnum = pgEnum("boost_type", ["BUMP", "TOP_AD", "URGENT", "FEATURED"]);
export const boostStatusEnum = pgEnum("boost_status", ["PENDING", "ACTIVE", "EXPIRED", "REJECTED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);
export const adStatusEnum = pgEnum("ad_status", ["ACTIVE", "EXPIRED", "DRAFT", "PENDING_REVIEW", "REJECTED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["AD_EXPIRED", "AD_FEATURED", "MESSAGE", "REFERRAL", "REVIEW"]);
export const sharePlatformEnum = pgEnum("share_platform", ["FACEBOOK", "TWITTER", "WHATSAPP", "LINKEDIN", "COPY_LINK"]);
export const fuelTypeEnum = pgEnum("fuel_type", ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "GAS"]);
export const transmissionEnum = pgEnum("transmission", ["MANUAL", "AUTOMATIC", "CVT"]);
export const bodyTypeEnum = pgEnum("body_type", ["SALOON", "HATCHBACK", "STATION_WAGON", "SUV"]);
export const bikeTypeEnum = pgEnum("bike_type", ["SCOOTER", "E_BIKE", "MOTORBIKES", "QUADRICYCLES"]);
export const heavyDutyVehicleTypeEnum = pgEnum("heavy_duty_vehicle_type", ["BED_TRAILER", "BOWSER", "BULLDOZER", "CRANE", "DUMP_TRUCK", "EXCAVATOR", "LOADER", "OTHER"]);

// ==========================================
// AUTH & USERS (Better Auth compatible)
// ==========================================
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  organizationId: text("organization_id"), // FK to organization
  isOrganization: boolean("is_organization").default(false),
  
  phone: text("phone"),
  phoneVerified: text("phone_verified"),
  whatsappNumber: text("whatsapp_number"),
  
  province: text("province"),
  district: text("district"),
  city: text("city"),
  location: text("location"),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
  impersonatedBy: text("impersonated_by"),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const twoFactors = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// ==========================================
// ORGANIZATIONS & MEMBERS
// ==========================================
export const organizations = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const members = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const organizationFollowers = pgTable("organization_follower", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("org_follower_unq").on(t.userId, t.organizationId),
}));

export const invitations = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});


// ==========================================
// CATEGORIES, MEDIA & LOCATION
// ==========================================
export const categories = pgTable("category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const tags = pgTable("tag", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const media = pgTable("media", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  uploaderId: text("uploader_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  type: mediaTypeEnum("type").notNull(),
  filename: text("filename"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const provinces = pgTable("province", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const districts = pgTable("district", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  provinceId: text("province_id").notNull().references(() => provinces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("district_unq").on(t.name, t.provinceId),
}));

export const cities = pgTable("city", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  districtId: text("district_id").notNull().references(() => districts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("city_unq").on(t.name, t.districtId),
}));

export const autoPartCategories = pgTable("auto_part_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const manufactureYears = pgTable("manufacture_year", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  year: text("year").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandCarousels = pgTable("brand_carousel", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  imageUrl: text("image_url").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicleModels = pgTable("vehicle_model", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  brand: text("brand"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("vehicle_model_unq").on(t.name, t.brand),
}));

// ==========================================
// ADS & BOOSTS
// ==========================================
export const ads = pgTable("ad", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizations.id),
  createdBy: text("created_by").notNull().references(() => users.id),

  title: text("title").notNull(),
  description: text("description").notNull(),
  type: adTypeEnum("type").notNull(),
  listingType: listingTypeEnum("listing_type").default("SELL").notNull(),
  price: doublePrecision("price"),
  published: boolean("published").default(false).notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
  boosted: boolean("boosted").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  boostExpiry: timestamp("boost_expiry"),
  featureExpiry: timestamp("feature_expiry"),
  status: adStatusEnum("status").default("ACTIVE").notNull(),
  expiryDate: timestamp("expiry_date"),
  rejectionDescription: text("rejection_description"),

  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoSlug: text("seo_slug").unique(),

  categoryId: text("category_id").references(() => categories.id),
  tags: text("tags").array(),

  condition: text("condition"),
  brand: text("brand"),
  model: text("model"),
  grade: text("grade"),
  trimEdition: text("trim_edition"),

  manufacturedYear: text("manufactured_year"),
  modelYear: text("model_year"),

  mileage: doublePrecision("mileage"),
  engineCapacity: doublePrecision("engine_capacity"),

  fuelType: fuelTypeEnum("fuel_type"),
  transmission: transmissionEnum("transmission"),
  bodyType: bodyTypeEnum("body_type"),

  bikeType: bikeTypeEnum("bike_type"),
  vehicleType: heavyDutyVehicleTypeEnum("vehicle_type"),

  serviceType: text("service_type"),
  partType: text("part_type"),
  partName: text("part_name"),
  partCategoryId: text("part_category_id").references(() => autoPartCategories.id),
  compatibleVehicleType: text("compatible_vehicle_type"),
  maintenanceType: text("maintenance_type"),

  name: text("name"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
  termsAndConditions: boolean("terms_and_conditions"),

  location: text("location"),
  address: text("address"),
  province: text("province"),
  district: text("district"),
  city: text("city"),

  specialNote: text("special_note"),
  metadata: jsonb("metadata"),

  boostTypes: boostTypeEnum("boost_types").array(),
  bumpActive: boolean("bump_active").default(false).notNull(),
  topAdActive: boolean("top_ad_active").default(false).notNull(),
  urgentActive: boolean("urgent_active").default(false).notNull(),
  featuredActive: boolean("featured_active").default(false).notNull(),
  boostStatus: boostStatusEnum("boost_status"),
  boostRequestedAt: timestamp("boost_requested_at"),
  boostStartAt: timestamp("boost_start_at"),
  boostEndAt: timestamp("boost_end_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  statusIdx: index("ad_status_idx").on(t.status),
  listingTypeIdx: index("ad_listing_type_idx").on(t.listingType),
  brandIdx: index("ad_brand_idx").on(t.brand),
  modelIdx: index("ad_model_idx").on(t.model),
  categoryIdIdx: index("ad_category_id_idx").on(t.categoryId),
  createdByIdx: index("ad_created_by_idx").on(t.createdBy),
  orgIdIdx: index("ad_org_id_idx").on(t.orgId),
}));

export const boostRequests = pgTable("boost_request", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  
  boostTypes: boostTypeEnum("boost_types").array().notNull(),
  bumpDays: integer("bump_days"),
  topAdDays: integer("top_ad_days"),
  urgentDays: integer("urgent_days"),
  featuredDays: integer("featured_days"),

  totalAmount: doublePrecision("total_amount").notNull(),
  bumpAmount: doublePrecision("bump_amount"),
  topAdAmount: doublePrecision("top_ad_amount"),
  urgentAmount: doublePrecision("urgent_amount"),
  featuredAmount: doublePrecision("featured_amount"),

  status: boostStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by"),

  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const boostPricings = pgTable("boost_pricing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boostType: boostTypeEnum("boost_type").notNull(),
  days: integer("days").notNull(),
  price: doublePrecision("price").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("boost_pricing_unq").on(t.boostType, t.days),
}));

export const revenueRecords = pgTable("revenue_record", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boostRequestId: text("boost_request_id").notNull().unique().references(() => boostRequests.id, { onDelete: "cascade" }),
  adId: text("ad_id").notNull(),
  userId: text("user_id").notNull(),
  boostTypes: boostTypeEnum("boost_types").array().notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  bumpAmount: doublePrecision("bump_amount"),
  topAdAmount: doublePrecision("top_ad_amount"),
  urgentAmount: doublePrecision("urgent_amount"),
  featuredAmount: doublePrecision("featured_amount"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const adRevisions = pgTable("ad_revision", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  version: integer("version").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adAnalytics = pgTable("ad_analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().unique().references(() => ads.id),
  views: integer("views").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adMedia = pgTable("ad_media", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  mediaId: text("media_id").notNull().references(() => media.id),
  order: integer("order").default(0).notNull(),
}, (t) => ({
  unq: uniqueIndex("ad_media_unq").on(t.adId, t.mediaId),
}));

// ==========================================
// MISCELLANEOUS (Payments, Favorites, Audit, etc.)
// ==========================================
export const payments = pgTable("payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull(),
  amount: doublePrecision("amount").notNull(),
  sessionId: text("session_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorite", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adId: text("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("favorite_unq").on(t.userId, t.adId),
  userIdx: index("favorite_user_idx").on(t.userId),
  adIdx: index("favorite_ad_idx").on(t.adId),
}));

export const savedSearches = pgTable("saved_search", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const geoHeatmaps = pgTable("geo_heatmap", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const messages = pgTable("message", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  adId: text("ad_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userNotifications = pgTable("notification", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shareEvents = pgTable("share_event", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  platform: sharePlatformEnum("platform").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

export const reports = pgTable("report", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  adId: text("ad_id").notNull().references(() => ads.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  orgId: text("org_id").references(() => organizations.id),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verificationCodes = pgTable("verification_code", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idx: index("vc_email_code_idx").on(t.email, t.code),
}));

export const newsletters = pgTable("newsletter", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainContent: text("plain_content"),
  recipientCount: integer("recipient_count").default(0).notNull(),
  recipientEmails: text("recipient_emails").array(),
  sentBy: text("sent_by").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleGrades = pgTable("vehicle_grade", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  model: text("model"),
  brand: text("brand"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("vehicle_grade_unq").on(t.name, t.model, t.brand),
}));

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  done: boolean("done").default(false).notNull(),
});

// ==========================================
// RELATIONS
// ==========================================

export const favoritesRelations = relations(favorites, ({ one }) => ({
  ad: one(ads, { fields: [favorites.adId], references: [ads.id] }),
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));

export const adsRelations = relations(ads, ({ one, many }) => ({
  org: one(organizations, { fields: [ads.orgId], references: [organizations.id] }),
  user: one(users, { fields: [ads.createdBy], references: [users.id] }),
  category: one(categories, { fields: [ads.categoryId], references: [categories.id] }),
  media: many(adMedia),
  reports: many(reports),
  favorites: many(favorites),
  revisions: many(adRevisions),
  analytics: one(adAnalytics, { fields: [ads.id], references: [adAnalytics.adId] }),
  boostRequests: many(boostRequests),
  shareEvents: many(shareEvents),
}));

export const shareEventsRelations = relations(shareEvents, ({ one }) => ({
  ad: one(ads, { fields: [shareEvents.adId], references: [ads.id] }),
}));

export const adAnalyticsRelations = relations(adAnalytics, ({ one }) => ({
  ad: one(ads, { fields: [adAnalytics.adId], references: [ads.id] }),
}));

export const adMediaRelations = relations(adMedia, ({ one }) => ({
  ad: one(ads, { fields: [adMedia.adId], references: [ads.id] }),
  media: one(media, { fields: [adMedia.mediaId], references: [media.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  ad: one(ads, { fields: [reports.adId], references: [ads.id] }),
  reporter: one(users, { fields: [reports.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  ads: many(ads),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  ads: many(ads),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ads: many(ads),
  favorites: many(favorites),
  reports: many(reports),
  boostRequests: many(boostRequests),
  revenueRecords: many(revenueRecords),
}));

export const boostRequestsRelations = relations(boostRequests, ({ one }) => ({
  ad: one(ads, { fields: [boostRequests.adId], references: [ads.id] }),
  user: one(users, { fields: [boostRequests.userId], references: [users.id] }),
}));

export const revenueRecordsRelations = relations(revenueRecords, ({ one }) => ({
  ad: one(ads, { fields: [revenueRecords.adId], references: [ads.id] }),
  user: one(users, { fields: [revenueRecords.userId], references: [users.id] }),
  boostRequest: one(boostRequests, { fields: [revenueRecords.boostRequestId], references: [boostRequests.id] }),
}));
