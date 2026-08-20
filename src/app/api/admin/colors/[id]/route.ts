export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { vehicleColors } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { name, hexCode, order, isActive } = body;
    const { id } = await params;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Color name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const formattedHex = hexCode !== undefined ? (hexCode ? hexCode.trim() : null) : undefined;

    const updateValues: Record<string, any> = {
      name: trimmedName,
      updatedAt: new Date(),
    };

    if (formattedHex !== undefined) updateValues.hexCode = formattedHex;
    if (typeof order === "number") updateValues.order = order;
    if (typeof isActive === "boolean") updateValues.isActive = isActive;

    const [updated] = await db
      .update(vehicleColors)
      .set(updateValues)
      .where(eq(vehicleColors.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "23505" || error.cause?.code === "23505") {
      return NextResponse.json({ error: "Color already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update color" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(vehicleColors)
      .where(eq(vehicleColors.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete color" },
      { status: 500 }
    );
  }
}
