export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { provinces, districts, cities } from "@/server/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const [allProvinces, allDistricts, allCities] = await Promise.all([
      db.select().from(provinces).orderBy(asc(provinces.name)),
      db.select().from(districts).orderBy(asc(districts.name)),
      db.select().from(cities).orderBy(asc(cities.name)),
    ]);

    // Group cities by districtId in O(N)
    const citiesByDistrict = new Map<string, { id: string; name: string }[]>();
    for (const city of allCities) {
      if (!city.districtId) continue;
      let list = citiesByDistrict.get(city.districtId);
      if (!list) {
        list = [];
        citiesByDistrict.set(city.districtId, list);
      }
      list.push({ id: city.id, name: city.name });
    }

    // Group districts by provinceId in O(N)
    const districtsByProvince = new Map<string, any[]>();
    for (const district of allDistricts) {
      if (!district.provinceId) continue;
      let list = districtsByProvince.get(district.provinceId);
      if (!list) {
        list = [];
        districtsByProvince.set(district.provinceId, list);
      }
      list.push({
        id: district.id,
        name: district.name,
        cities: citiesByDistrict.get(district.id) || [],
      });
    }

    const formattedProvinces = allProvinces.map((province) => ({
      id: province.id,
      name: province.name,
      districts: districtsByProvince.get(province.id) || [],
    }));

    return NextResponse.json(
      { provinces: formattedProvinces },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch locations" }, { status: 500 });
  }
}
