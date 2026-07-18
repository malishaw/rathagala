export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { manufactureYears } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const years = await db.select().from(manufactureYears).orderBy(desc(manufactureYears.year));
    return NextResponse.json({ years });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch manufacture years" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { year } = body;
    if (!year) return NextResponse.json({ error: "Year is required" }, { status: 400 });

    const [newYear] = await db.insert(manufactureYears).values({ year }).returning();
    return NextResponse.json(newYear);
  } catch (error: any) {
    if (error.code === '23505' || error.cause?.code === '23505') {
      return NextResponse.json({ error: "Year already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create manufacture year" }, { status: 500 });
  }
}
