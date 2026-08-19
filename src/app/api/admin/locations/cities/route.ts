export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { cities } from "@/server/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role?.toLowerCase() !== "admin") return null;
  return session;
}

// GET - List cities (optionally filtered by districtId)
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId");

    let query = db
      .select({
        id: cities.id,
        name: cities.name,
        districtId: cities.districtId,
        createdAt: cities.createdAt,
        updatedAt: cities.updatedAt,
      })
      .from(cities)
      .orderBy(asc(cities.name));

    const allCities = districtId
      ? await query.where(eq(cities.districtId, districtId))
      : await query;

    return NextResponse.json({ cities: allCities });
  } catch (error: any) {
    console.error("[GET CITIES] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

// POST - Batch save/sync cities for a district
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const districtId = body?.districtId?.trim();
    const citiesText = body?.citiesText ?? "";

    if (!districtId) {
      return NextResponse.json(
        { error: "District ID is required" },
        { status: 400 }
      );
    }

    // Parse comma-separated or newline-separated city names
    const rawNames = citiesText
      .split(/[\n,]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // Deduplicate case-insensitively while preserving first seen casing
    const uniqueCityNames: string[] = [];
    const seenLower = new Set<string>();

    for (const name of rawNames) {
      const lower = name.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        uniqueCityNames.push(name);
      }
    }

    // Fetch existing cities in this district
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.districtId, districtId));

    const existingMap = new Map<string, typeof existing[0]>();
    for (const c of existing) {
      existingMap.set(c.name.toLowerCase(), c);
    }

    // Determine cities to delete
    const toDeleteIds: string[] = [];
    for (const [lowerName, cityObj] of existingMap.entries()) {
      if (!seenLower.has(lowerName)) {
        toDeleteIds.push(cityObj.id);
      }
    }

    if (toDeleteIds.length > 0) {
      await db.delete(cities).where(inArray(cities.id, toDeleteIds));
    }

    // Determine new cities to insert
    const toInsert = uniqueCityNames
      .filter((name) => !existingMap.has(name.toLowerCase()))
      .map((name) => ({
        name,
        districtId,
      }));

    if (toInsert.length > 0) {
      await db.insert(cities).values(toInsert);
    }

    // Fetch updated list of cities for this district
    const updatedCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        districtId: cities.districtId,
        createdAt: cities.createdAt,
        updatedAt: cities.updatedAt,
      })
      .from(cities)
      .where(eq(cities.districtId, districtId))
      .orderBy(asc(cities.name));

    return NextResponse.json({ cities: updatedCities });
  } catch (error: any) {
    console.error("[SAVE CITIES] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save cities" },
      { status: 500 }
    );
  }
}
