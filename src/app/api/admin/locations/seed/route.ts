export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { provinces, districts, cities } from "@/server/db/schema";
import { locationData as envLocationData } from "@/lib/location-data";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role?.toLowerCase() !== "admin") return null;
  return session;
}

// Complete Sri Lanka default provinces, districts, and cities dataset
const DEFAULT_SRI_LANKA_LOCATIONS: {
  province: string;
  districts: { name: string; cities: string[] }[];
}[] = [
  {
    province: "Western",
    districts: [
      {
        name: "Colombo",
        cities: [
          "Colombo 1",
          "Colombo 2",
          "Colombo 3",
          "Colombo 4",
          "Colombo 5",
          "Colombo 6",
          "Colombo 7",
          "Colombo 8",
          "Colombo 9",
          "Colombo 10",
          "Colombo 11",
          "Colombo 12",
          "Colombo 13",
          "Colombo 14",
          "Colombo 15",
          "Dehiwala",
          "Mount Lavinia",
          "Moratuwa",
          "Nugegoda",
          "Maharagama",
          "Kotte",
          "Battaramulla",
          "Malabe",
          "Homagama",
          "Kaduwela",
          "Piliyandala",
          "Avissawella",
          "Athurugiriya",
          "Kesbewa",
          "Kohuwala",
          "Boralesgamuwa",
          "Rajagiriya",
          "Wellampitiya",
          "Hanwella",
          "Padukka",
        ],
      },
      {
        name: "Gampaha",
        cities: [
          "Gampaha",
          "Negombo",
          "Kelaniya",
          "Kadawatha",
          "Kiribathgoda",
          "Wattala",
          "Ja-Ela",
          "Nittambuwa",
          "Minuwangoda",
          "Veyangoda",
          "Mirigama",
          "Ragama",
          "Kandana",
          "Katunayake",
          "Divulapitiya",
          "Ganemulla",
          "Peliyagoda",
          "Delgoda",
          "Biyagama",
          "Seeduwa",
        ],
      },
      {
        name: "Kalutara",
        cities: [
          "Kalutara",
          "Panadura",
          "Horana",
          "Matugama",
          "Bandaragama",
          "Beruwala",
          "Aluthgama",
          "Wadduwa",
          "Ingiriya",
          "Bulathsinhala",
          "Dodangoda",
          "Payagala",
        ],
      },
    ],
  },
  {
    province: "Central",
    districts: [
      {
        name: "Kandy",
        cities: [
          "Kandy",
          "Peradeniya",
          "Katugastota",
          "Gampola",
          "Nawalapitiya",
          "Kadugannawa",
          "Akurana",
          "Kundasale",
          "Digana",
          "Gelioya",
          "Pilimathalawa",
          "Teldeniya",
          "Wattegama",
        ],
      },
      {
        name: "Matale",
        cities: [
          "Matale",
          "Dambulla",
          "Galewela",
          "Sigiriya",
          "Ukuwela",
          "Rattota",
          "Palapathwela",
          "Naula",
        ],
      },
      {
        name: "Nuwara Eliya",
        cities: [
          "Nuwara Eliya",
          "Hatton",
          "Talawakele",
          "Nanu Oya",
          "Maskeliya",
          "Ginigathena",
          "Ragala",
          "Walapane",
          "Kotagala",
        ],
      },
    ],
  },
  {
    province: "Southern",
    districts: [
      {
        name: "Galle",
        cities: [
          "Galle",
          "Hikkaduwa",
          "Ambalangoda",
          "Elpitiya",
          "Koggala",
          "Baddegama",
          "Ahangama",
          "Karapitiya",
          "Bentota",
          "Batapola",
          "Unawatuna",
        ],
      },
      {
        name: "Matara",
        cities: [
          "Matara",
          "Weligama",
          "Dikwella",
          "Akuressa",
          "Kamburugamuwa",
          "Hakmana",
          "Deniyaya",
          "Kekanadurra",
          "Devinuwara",
          "Gandara",
        ],
      },
      {
        name: "Hambantota",
        cities: [
          "Hambantota",
          "Tangalle",
          "Beliatta",
          "Ambalantota",
          "Tissamaharama",
          "Ranna",
          "Walasmulla",
          "Middeniya",
          "Suriyawewa",
        ],
      },
    ],
  },
  {
    province: "Northern",
    districts: [
      {
        name: "Jaffna",
        cities: [
          "Jaffna",
          "Chavakachcheri",
          "Point Pedro",
          "Kankesanthurai",
          "Nallur",
          "Karainagar",
          "Velanai",
          "Chunnakam",
          "Manipay",
          "Kopay",
        ],
      },
      {
        name: "Kilinochchi",
        cities: ["Kilinochchi", "Paranthan", "Pooneryn", "Pallai"],
      },
      {
        name: "Mannar",
        cities: ["Mannar", "Murunkan", "Pesalai", "Talaimannar"],
      },
      {
        name: "Vavuniya",
        cities: ["Vavuniya", "Omanthai", "Cheddikulam", "Nedunkeni"],
      },
      {
        name: "Mullaitivu",
        cities: ["Mullaitivu", "Puthukkudiyiruppu", "Oddusuddan", "Mulliyawalai"],
      },
    ],
  },
  {
    province: "Eastern",
    districts: [
      {
        name: "Trincomalee",
        cities: ["Trincomalee", "Mutur", "Kinniya", "Nilaveli", "Kantale"],
      },
      {
        name: "Batticaloa",
        cities: ["Batticaloa", "Kattankudy", "Eravur", "Valachchenai", "Kaluwanchikudy"],
      },
      {
        name: "Ampara",
        cities: [
          "Ampara",
          "Kalmunai",
          "Samanthurai",
          "Akkaraipattu",
          "Pottuvil",
          "Sainthamaruthu",
          "Uhana",
        ],
      },
    ],
  },
  {
    province: "North Western",
    districts: [
      {
        name: "Kurunegala",
        cities: [
          "Kurunegala",
          "Kuliyapitiya",
          "Narammala",
          "Mawathagama",
          "Giriulla",
          "Pannala",
          "Wariyapola",
          "Ibbagamuwa",
          "Alawwa",
          "Polgahawela",
          "Nikaweratiya",
        ],
      },
      {
        name: "Puttalam",
        cities: [
          "Puttalam",
          "Chilaw",
          "Wennappuwa",
          "Marawila",
          "Nattandiya",
          "Dankotuwa",
          "Anamaduwa",
        ],
      },
    ],
  },
  {
    province: "North Central",
    districts: [
      {
        name: "Anuradhapura",
        cities: [
          "Anuradhapura",
          "Kekirawa",
          "Thabuththegama",
          "Medawachchiya",
          "Eppawala",
          "Galnewa",
          "Nochchiyagama",
          "Tambuttegama",
        ],
      },
      {
        name: "Polonnaruwa",
        cities: [
          "Polonnaruwa",
          "Kaduruwela",
          "Hingurakgoda",
          "Medirigiriya",
          "Aralaganwila",
          "Giritale",
        ],
      },
    ],
  },
  {
    province: "Uva",
    districts: [
      {
        name: "Badulla",
        cities: [
          "Badulla",
          "Bandarawela",
          "Welimada",
          "Mahiyanganaya",
          "Hali-Ela",
          "Diyatalawa",
          "Ella",
          "Passara",
          "Haputale",
        ],
      },
      {
        name: "Moneragala",
        cities: [
          "Moneragala",
          "Wellawaya",
          "Bibile",
          "Buttala",
          "Kataragama",
          "Siyambalanduwa",
        ],
      },
    ],
  },
  {
    province: "Sabaragamuwa",
    districts: [
      {
        name: "Ratnapura",
        cities: [
          "Ratnapura",
          "Pelmadulla",
          "Balangoda",
          "Embilipitiya",
          "Eheliyagoda",
          "Kuruwita",
          "Kahawatta",
          "Godakawela",
          "Rakwana",
        ],
      },
      {
        name: "Kegalle",
        cities: [
          "Kegalle",
          "Mawanella",
          "Warakapola",
          "Rambukkana",
          "Ruwanwella",
          "Yatiyanthota",
          "Dehiowita",
          "Deraniyagala",
        ],
      },
    ],
  },
];

// POST - Seed/Import location data
export async function POST() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let provincesCreated = 0;
    let districtsCreated = 0;
    let citiesCreated = 0;

    // Use ENV location data if present, otherwise fall back to DEFAULT_SRI_LANKA_LOCATIONS
    const hasEnvData = Object.keys(envLocationData).length > 0;

    const sourceData: {
      province: string;
      districts: { name: string; cities: string[] }[];
    }[] = hasEnvData
      ? Object.entries(envLocationData).map(([province, districtMap]) => ({
          province,
          districts: Object.entries(districtMap).map(([name, cityList]) => ({
            name,
            cities: cityList,
          })),
        }))
      : DEFAULT_SRI_LANKA_LOCATIONS;

    for (const prov of sourceData) {
      // Find or insert province
      let [existingProv] = await db
        .select()
        .from(provinces)
        .where(eq(provinces.name, prov.province));

      if (!existingProv) {
        const [newProv] = await db
          .insert(provinces)
          .values({ name: prov.province })
          .returning();
        existingProv = newProv;
        provincesCreated++;
      }

      for (const dist of prov.districts) {
        // Find or insert district
        let existingDist = await db.query.districts.findFirst({
          where: (fields, { and, eq: eqOp }) =>
            and(eqOp(fields.name, dist.name), eqOp(fields.provinceId, existingProv.id)),
        });

        if (!existingDist) {
          const [newDist] = await db
            .insert(districts)
            .values({
              name: dist.name,
              provinceId: existingProv.id,
            })
            .returning();
          existingDist = newDist;
          districtsCreated++;
        }

        // Fetch existing cities in this district
        const existingDistrictCities = await db
          .select()
          .from(cities)
          .where(eq(cities.districtId, existingDist.id));

        const existingCityNames = new Set(
          existingDistrictCities.map((c) => c.name.toLowerCase())
        );

        const citiesToInsert = dist.cities
          .map((c) => c.trim())
          .filter((c) => c.length > 0 && !existingCityNames.has(c.toLowerCase()))
          .map((cityName) => ({
            name: cityName,
            districtId: existingDist.id,
          }));

        if (citiesToInsert.length > 0) {
          await db.insert(cities).values(citiesToInsert);
          citiesCreated += citiesToInsert.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      provincesCreated,
      districtsCreated,
      citiesCreated,
      message: `Locations seeded: ${provincesCreated} provinces, ${districtsCreated} districts, ${citiesCreated} cities added.`,
    });
  } catch (error: any) {
    console.error("[SEED LOCATIONS] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed locations" },
      { status: 500 }
    );
  }
}
