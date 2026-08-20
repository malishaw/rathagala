export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { vehicleColors } from "@/server/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const colors = await db
      .select()
      .from(vehicleColors)
      .orderBy(asc(vehicleColors.order), asc(vehicleColors.name));
    return NextResponse.json({ colors });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch colors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, hexCode, order, isActive } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Color name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const formattedHex = hexCode ? hexCode.trim() : null;

    const [newColor] = await db
      .insert(vehicleColors)
      .values({
        name: trimmedName,
        hexCode: formattedHex,
        order: typeof order === "number" ? order : 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
      })
      .returning();

    return NextResponse.json(newColor, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505" || error.cause?.code === "23505") {
      return NextResponse.json({ error: "Color already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to create color" },
      { status: 500 }
    );
  }
}
