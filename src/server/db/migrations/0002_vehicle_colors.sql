CREATE TABLE IF NOT EXISTS "vehicle_color" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hex_code" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_color_name_unique" UNIQUE("name")
);
