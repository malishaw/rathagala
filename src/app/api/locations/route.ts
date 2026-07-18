export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { provinces, districts, cities } from "@/server/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allProvinces = await db.select().from(provinces).orderBy(asc(provinces.name));
    const allDistricts = await db.select().from(districts).orderBy(asc(districts.name));
    const allCities = await db.select().from(cities).orderBy(asc(cities.name));

    const formattedProvinces = allProvinces.map((province) => {
      const provinceDistricts = allDistricts.filter((d) => d.provinceId === province.id);
      
      return {
        id: province.id,
        name: province.name,
        districts: provinceDistricts.map((district) => {
          const districtCities = allCities.filter((c) => c.districtId === district.id);
          return {
            id: district.id,
            name: district.name,
            cities: districtCities.map((city) => ({ id: city.id, name: city.name }))
          };
        })
      };
    });

    return NextResponse.json({ provinces: formattedProvinces });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch locations" }, { status: 500 });
  }
}
