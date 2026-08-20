export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { vehicleColors } from "@/server/db/schema";

const DEFAULT_COLORS: Array<{ name: string; hexCode: string; order: number }> = [
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

export async function POST() {
  try {
    let createdCount = 0;
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
        createdCount++;
      } catch {
        // Skip existing
      }
    }

    return NextResponse.json({
      message: `Seeded default colors successfully`,
      count: createdCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed colors" },
      { status: 500 }
    );
  }
}
