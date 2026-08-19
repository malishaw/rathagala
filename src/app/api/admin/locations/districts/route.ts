export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { districts, cities } from "@/server/db/schema";
import { asc, eq, sql } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role?.toLowerCase() !== "admin") return null;
  return session;
}

// GET - List districts (optionally filtered by provinceId) with city count
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");

    let query = db
      .select({
        id: districts.id,
        name: districts.name,
        provinceId: districts.provinceId,
        createdAt: districts.createdAt,
        updatedAt: districts.updatedAt,
      })
      .from(districts)
      .orderBy(asc(districts.name));

    const allDistricts = provinceId
      ? await query.where(eq(districts.provinceId, provinceId))
      : await query;

    const allCities = await db
      .select({
        districtId: cities.districtId,
        count: sql<number>`count(*)::int`,
      })
      .from(cities)
      .groupBy(cities.districtId);

    const cityCountMap = new Map<string, number>();
    for (const c of allCities) {
      if (c.districtId) {
        cityCountMap.set(c.districtId, Number(c.count));
      }
    }

    const formatted = allDistricts.map((d) => ({
      ...d,
      _count: {
        cities: cityCountMap.get(d.id) ?? 0,
      },
    }));

    return NextResponse.json({ districts: formatted });
  } catch (error: any) {
    console.error("[GET DISTRICTS] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch districts" },
      { status: 500 }
    );
  }
}

// POST - Create a district
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = body?.name?.trim();
    const provinceId = body?.provinceId?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "District name is required" },
        { status: 400 }
      );
    }

    if (!provinceId) {
      return NextResponse.json(
        { error: "Province ID is required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(districts)
      .values({ name, provinceId })
      .returning();

    return NextResponse.json(
      {
        district: {
          ...created,
          _count: { cities: 0 },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[CREATE DISTRICT] Error:", error);
    if (error.code === "23505" || error.cause?.code === "23505") {
      return NextResponse.json(
        { error: "District with this name already exists in this province" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create district" },
      { status: 500 }
    );
  }
}
