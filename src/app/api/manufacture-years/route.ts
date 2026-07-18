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
