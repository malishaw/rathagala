CREATE TYPE "public"."ad_status" AS ENUM('ACTIVE', 'EXPIRED', 'DRAFT', 'PENDING_REVIEW', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."ad_type" AS ENUM('CAR', 'VAN', 'MOTORCYCLE', 'BICYCLE', 'THREE_WHEEL', 'BUS', 'LORRY', 'HEAVY_DUTY', 'TRACTOR', 'AUTO_SERVICE', 'RENTAL', 'AUTO_PARTS', 'MAINTENANCE', 'BOAT');--> statement-breakpoint
CREATE TYPE "public"."bike_type" AS ENUM('SCOOTER', 'E_BIKE', 'MOTORBIKES', 'QUADRICYCLES');--> statement-breakpoint
CREATE TYPE "public"."body_type" AS ENUM('SALOON', 'HATCHBACK', 'STATION_WAGON', 'SUV');--> statement-breakpoint
CREATE TYPE "public"."boost_status" AS ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."boost_type" AS ENUM('BUMP', 'TOP_AD', 'URGENT', 'FEATURED');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GAS');--> statement-breakpoint
CREATE TYPE "public"."heavy_duty_vehicle_type" AS ENUM('BED_TRAILER', 'BOWSER', 'BULLDOZER', 'CRANE', 'DUMP_TRUCK', 'EXCAVATOR', 'LOADER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('SELL', 'WANT', 'RENT', 'HIRE');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('IMAGE', 'VIDEO', 'PDF', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('AD_EXPIRED', 'AD_FEATURED', 'MESSAGE', 'REFERRAL', 'REVIEW');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('BOOST', 'FEATURE');--> statement-breakpoint
CREATE TYPE "public"."share_platform" AS ENUM('FACEBOOK', 'TWITTER', 'WHATSAPP', 'LINKEDIN', 'COPY_LINK');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('MANUAL', 'AUTOMATIC', 'CVT');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_analytics_ad_id_unique" UNIQUE("ad_id")
);
--> statement-breakpoint
CREATE TABLE "ad_media" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"media_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"version" integer NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"created_by" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "ad_type" NOT NULL,
	"listing_type" "listing_type" DEFAULT 'SELL' NOT NULL,
	"price" double precision,
	"published" boolean DEFAULT false NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"boosted" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"boost_expiry" timestamp,
	"feature_expiry" timestamp,
	"status" "ad_status" DEFAULT 'ACTIVE' NOT NULL,
	"expiry_date" timestamp,
	"rejection_description" text,
	"seo_title" text,
	"seo_description" text,
	"seo_slug" text,
	"category_id" text,
	"tags" text[],
	"condition" text,
	"brand" text,
	"model" text,
	"grade" text,
	"trim_edition" text,
	"manufactured_year" text,
	"model_year" text,
	"mileage" double precision,
	"engine_capacity" double precision,
	"fuel_type" "fuel_type",
	"transmission" "transmission",
	"body_type" "body_type",
	"bike_type" "bike_type",
	"vehicle_type" "heavy_duty_vehicle_type",
	"service_type" text,
	"part_type" text,
	"part_name" text,
	"part_category_id" text,
	"compatible_vehicle_type" text,
	"maintenance_type" text,
	"name" text,
	"phone_number" text,
	"whatsapp_number" text,
	"terms_and_conditions" boolean,
	"location" text,
	"address" text,
	"province" text,
	"district" text,
	"city" text,
	"special_note" text,
	"metadata" jsonb,
	"boost_types" "boost_type"[],
	"bump_active" boolean DEFAULT false NOT NULL,
	"top_ad_active" boolean DEFAULT false NOT NULL,
	"urgent_active" boolean DEFAULT false NOT NULL,
	"featured_active" boolean DEFAULT false NOT NULL,
	"boost_status" "boost_status",
	"boost_requested_at" timestamp,
	"boost_start_at" timestamp,
	"boost_end_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_seo_slug_unique" UNIQUE("seo_slug")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"org_id" text,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_part_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auto_part_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "boost_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"boost_type" "boost_type" NOT NULL,
	"days" integer NOT NULL,
	"price" double precision NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boost_request" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"user_id" text NOT NULL,
	"boost_types" "boost_type"[] NOT NULL,
	"bump_days" integer,
	"top_ad_days" integer,
	"urgent_days" integer,
	"featured_days" integer,
	"total_amount" double precision NOT NULL,
	"bump_amount" double precision,
	"top_ad_amount" double precision,
	"urgent_amount" double precision,
	"featured_amount" double precision,
	"status" "boost_status" DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_carousel" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_carousel_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "category_name_unique" UNIQUE("name"),
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "city" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"district_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "district" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"province_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ad_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_heatmap" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"country" text,
	"region" text,
	"city" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manufacture_year" (
	"id" text PRIMARY KEY NOT NULL,
	"year" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manufacture_year_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"uploader_id" text NOT NULL,
	"url" text NOT NULL,
	"type" "media_type" NOT NULL,
	"filename" text,
	"size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"ad_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"plain_content" text,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"recipient_emails" text[],
	"sent_by" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_follower" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" "payment_type" NOT NULL,
	"status" "payment_status" NOT NULL,
	"amount" double precision NOT NULL,
	"session_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "province" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "province_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ad_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_record" (
	"id" text PRIMARY KEY NOT NULL,
	"boost_request_id" text NOT NULL,
	"ad_id" text NOT NULL,
	"user_id" text NOT NULL,
	"boost_types" "boost_type"[] NOT NULL,
	"total_amount" double precision NOT NULL,
	"bump_amount" double precision,
	"top_ad_amount" double precision,
	"urgent_amount" double precision,
	"featured_amount" double precision,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_record_boost_request_id_unique" UNIQUE("boost_request_id")
);
--> statement-breakpoint
CREATE TABLE "saved_search" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "share_event" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"platform" "share_platform" NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name"),
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"two_factor_enabled" boolean,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"organization_id" text,
	"is_organization" boolean DEFAULT false,
	"phone" text,
	"phone_verified" text,
	"whatsapp_number" text,
	"province" text,
	"district" text,
	"city" text,
	"location" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_grade" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"model" text,
	"brand" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_model" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_code" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_analytics" ADD CONSTRAINT "ad_analytics_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_media" ADD CONSTRAINT "ad_media_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_media" ADD CONSTRAINT "ad_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_revision" ADD CONSTRAINT "ad_revision_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad" ADD CONSTRAINT "ad_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad" ADD CONSTRAINT "ad_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad" ADD CONSTRAINT "ad_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad" ADD CONSTRAINT "ad_part_category_id_auto_part_category_id_fk" FOREIGN KEY ("part_category_id") REFERENCES "public"."auto_part_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_request" ADD CONSTRAINT "boost_request_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_request" ADD CONSTRAINT "boost_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city" ADD CONSTRAINT "city_district_id_district_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."district"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "district" ADD CONSTRAINT "district_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_heatmap" ADD CONSTRAINT "geo_heatmap_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_receiver_id_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_follower" ADD CONSTRAINT "organization_follower_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_follower" ADD CONSTRAINT "organization_follower_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_record" ADD CONSTRAINT "revenue_record_boost_request_id_boost_request_id_fk" FOREIGN KEY ("boost_request_id") REFERENCES "public"."boost_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_event" ADD CONSTRAINT "share_event_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ad_media_unq" ON "ad_media" USING btree ("ad_id","media_id");--> statement-breakpoint
CREATE INDEX "ad_status_idx" ON "ad" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_listing_type_idx" ON "ad" USING btree ("listing_type");--> statement-breakpoint
CREATE INDEX "ad_brand_idx" ON "ad" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "ad_model_idx" ON "ad" USING btree ("model");--> statement-breakpoint
CREATE INDEX "ad_category_id_idx" ON "ad" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "ad_created_by_idx" ON "ad" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "ad_org_id_idx" ON "ad" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "boost_pricing_unq" ON "boost_pricing" USING btree ("boost_type","days");--> statement-breakpoint
CREATE UNIQUE INDEX "city_unq" ON "city" USING btree ("name","district_id");--> statement-breakpoint
CREATE UNIQUE INDEX "district_unq" ON "district" USING btree ("name","province_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_unq" ON "favorite" USING btree ("user_id","ad_id");--> statement-breakpoint
CREATE INDEX "favorite_user_idx" ON "favorite" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorite_ad_idx" ON "favorite" USING btree ("ad_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_follower_unq" ON "organization_follower" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_grade_unq" ON "vehicle_grade" USING btree ("name","model","brand");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_model_unq" ON "vehicle_model" USING btree ("name","brand");--> statement-breakpoint
CREATE INDEX "vc_email_code_idx" ON "verification_code" USING btree ("email","code");