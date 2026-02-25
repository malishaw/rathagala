
// Sri Lankan provinces, districts, and cities data
// Each province is loaded from its own NEXT_PUBLIC_<PROVINCE> env variable.
// To add/remove locations, edit the JSON values in .env — no code changes needed.

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

function parseLocationData(): Record<string, Record<string, string[]>> {
  const result: Record<string, Record<string, string[]>> = {};

  for (const [province, raw] of Object.entries(PROVINCE_ENV_MAP)) {
    if (!raw) {
      console.warn(`NEXT_PUBLIC env for "${province}" is not set – skipping.`);
      continue;
    }
    try {
      result[province] = JSON.parse(raw) as Record<string, string[]>;
    } catch (e) {
      console.error(`Failed to parse location data for "${province}":`, e);
    }
  }

  if (Object.keys(result).length === 0) {
    console.warn("No province location data loaded – location dropdowns will be empty.");
  }

  return result;
}

export const locationData: Record<string, Record<string, string[]>> = parseLocationData();

/** All district names derived from locationData, sorted alphabetically. */
export function getAllDistricts(): string[] {
  const districts = new Set<string>();
  Object.values(locationData).forEach((province) => {
    Object.keys(province).forEach((d) => districts.add(d));
  });
  return Array.from(districts).sort();
}

/** All city names derived from locationData, sorted alphabetically. */
export function getAllCities(): string[] {
  const cities = new Set<string>();
  Object.values(locationData).forEach((province) => {
    Object.values(province).forEach((districtCities) => {
      districtCities.forEach((c) => cities.add(c));
    });
  });
  return Array.from(cities).sort();
}
