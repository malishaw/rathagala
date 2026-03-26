import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

const PROVINCE_ENV_MAP: Record<string, string | undefined> = {
  Western: process.env.NEXT_PUBLIC_WESTERN,
  Central: process.env.NEXT_PUBLIC_CENTRAL,
  Southern: process.env.NEXT_PUBLIC_SOUTHERN,
  Northern: process.env.NEXT_PUBLIC_NORTHERN,
  Eastern: process.env.NEXT_PUBLIC_EASTERN,
  "North Western": process.env.NEXT_PUBLIC_NORTH_WESTERN,
  "North Central": process.env.NEXT_PUBLIC_NORTH_CENTRAL,
  Uva: process.env.NEXT_PUBLIC_UVA,
  Sabaragamuwa: process.env.NEXT_PUBLIC_SABARAGAMUWA,
};

// POST - Seed provinces/districts/cities from .env variables
export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let provincesCreated = 0;
  let districtsCreated = 0;
  let citiesCreated = 0;

  for (const [provinceName, raw] of Object.entries(PROVINCE_ENV_MAP)) {
    if (!raw) continue;
    let districtMap: Record<string, string[]>;
    try {
      districtMap = JSON.parse(raw) as Record<string, string[]>;
    } catch {
      continue;
    }

    const province = await prisma.province.upsert({
      where: { name: provinceName },
      update: {},
      create: { name: provinceName },
    });
    provincesCreated++;

    for (const [districtName, cities] of Object.entries(districtMap)) {
      let district = await prisma.district.findFirst({
        where: { name: districtName, provinceId: province.id },
      });
      if (!district) {
        district = await prisma.district.create({
          data: { name: districtName, provinceId: province.id },
        });
        districtsCreated++;
      }

      for (const cityName of cities) {
        const trimmed = cityName.trim();
        if (!trimmed) continue;
        const exists = await prisma.city.findFirst({
          where: { name: trimmed, districtId: district.id },
        });
        if (!exists) {
          await prisma.city.create({
            data: { name: trimmed, districtId: district.id },
          });
          citiesCreated++;
        }
      }
    }
  }

  return NextResponse.json({ provincesCreated, districtsCreated, citiesCreated });
}
