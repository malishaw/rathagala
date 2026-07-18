export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { manufactureYears } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { year } = body;
    const { id } = await params;

    if (!year) return NextResponse.json({ error: "Year is required" }, { status: 400 });

    const [updated] = await db
      .update(manufactureYears)
      .set({ year, updatedAt: new Date() })
      .where(eq(manufactureYears.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === '23505' || error.cause?.code === '23505') {
      return NextResponse.json({ error: "Year already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to update year" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(manufactureYears)
      .where(eq(manufactureYears.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete year" }, { status: 500 });
  }
}
