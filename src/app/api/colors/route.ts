export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { vehicleColors } from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const colors = await db
      .select({
        id: vehicleColors.id,
        name: vehicleColors.name,
        hexCode: vehicleColors.hexCode,
        order: vehicleColors.order,
      })
      .from(vehicleColors)
      .where(eq(vehicleColors.isActive, true))
      .orderBy(asc(vehicleColors.order), asc(vehicleColors.name));

    return NextResponse.json({ colors });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch colors" },
      { status: 500 }
    );
  }
}
