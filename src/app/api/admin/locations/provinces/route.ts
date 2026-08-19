export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { provinces, districts } from "@/server/db/schema";
import { asc, eq, sql } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role?.toLowerCase() !== "admin") return null;
  return session;
}

// GET - List all provinces with district count
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allProvinces = await db
      .select({
        id: provinces.id,
        name: provinces.name,
        createdAt: provinces.createdAt,
        updatedAt: provinces.updatedAt,
      })
      .from(provinces)
      .orderBy(asc(provinces.name));

    const allDistricts = await db
      .select({
        provinceId: districts.provinceId,
        count: sql<number>`count(*)::int`,
      })
      .from(districts)
      .groupBy(districts.provinceId);

    const districtCountMap = new Map<string, number>();
    for (const d of allDistricts) {
      if (d.provinceId) {
        districtCountMap.set(d.provinceId, Number(d.count));
      }
    }

    const formatted = allProvinces.map((p) => ({
      ...p,
      _count: {
        districts: districtCountMap.get(p.id) ?? 0,
      },
    }));

    return NextResponse.json({ provinces: formatted });
  } catch (error: any) {
    console.error("[GET PROVINCES] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}

// POST - Create a province
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Province name is required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(provinces)
      .values({ name })
      .returning();

    return NextResponse.json(
      {
        province: {
          ...created,
          _count: { districts: 0 },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[CREATE PROVINCE] Error:", error);
    if (error.code === "23505" || error.cause?.code === "23505") {
      return NextResponse.json(
        { error: "Province with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create province" },
      { status: 500 }
    );
  }
}
