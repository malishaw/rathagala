import { sql } from "drizzle-orm";
import { db } from "../src/server/db";
import { vehicleColors } from "../src/server/db/schema";

const DEFAULT_COLORS = [
  { name: "Black", hexCode: "#000000", order: 1 },
  { name: "White", hexCode: "#FFFFFF", order: 2 },
  { name: "Silver", hexCode: "#C0C0C0", order: 3 },
  { name: "Grey", hexCode: "#808080", order: 4 },
  { name: "Red", hexCode: "#E53E3E", order: 5 },
  { name: "Blue", hexCode: "#3182CE", order: 6 },
  { name: "Brown", hexCode: "#8D5B4C", order: 7 },
  { name: "Beige", hexCode: "#F5F5DC", order: 8 },
  { name: "Green", hexCode: "#38A169", order: 9 },
  { name: "Yellow", hexCode: "#D69E2E", order: 10 },
  { name: "Orange", hexCode: "#DD6B20", order: 11 },
  { name: "Gold", hexCode: "#D4AF37", order: 12 },
  { name: "Bronze", hexCode: "#CD7F32", order: 13 },
  { name: "Purple", hexCode: "#805AD5", order: 14 },
  { name: "Maroon", hexCode: "#800000", order: 15 },
  { name: "Other", hexCode: "#A0AEC0", order: 99 },
];

async function initColorsTable() {
  console.log("Creating vehicle_color table if it does not exist...");
  await db.execute(sql`
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
  `);
  console.log("vehicle_color table verified.");

  console.log("Seeding default colors...");
  for (const item of DEFAULT_COLORS) {
    try {
      await db
        .insert(vehicleColors)
        .values({
          name: item.name,
          hexCode: item.hexCode,
          order: item.order,
          isActive: true,
        })
        .onConflictDoNothing();
    } catch (e) {
      console.warn(`Could not seed ${item.name}:`, e);
    }
  }

  const all = await db.select().from(vehicleColors);
  console.log(`Total colors in database: ${all.length}`);
  console.log(all.map(c => `${c.name} (${c.hexCode})`).join(", "));
  process.exit(0);
}

initColorsTable().catch((err) => {
  console.error("Error initializing colors table:", err);
  process.exit(1);
});
