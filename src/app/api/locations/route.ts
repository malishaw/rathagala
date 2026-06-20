import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";

// Robust static fallback data in case database is empty or connection fails
const FALLBACK_PROVINCES = [
  {
    id: "fallback-prov-western",
    name: "Western",
    districts: [
      {
        id: "fallback-dist-colombo",
        name: "Colombo",
        cities: [
          { id: "fallback-city-colombo-1", name: "Colombo 01" },
          { id: "fallback-city-colombo-3", name: "Colombo 03" },
          { id: "fallback-city-colombo-4", name: "Colombo 04" },
          { id: "fallback-city-colombo-7", name: "Colombo 07" },
          { id: "fallback-city-dehiwala", name: "Dehiwala" },
          { id: "fallback-city-kotte", name: "Sri Jayawardenepura Kotte" },
          { id: "fallback-city-maharagama", name: "Maharagama" },
          { id: "fallback-city-moratuwa", name: "Moratuwa" },
          { id: "fallback-city-nugegoda", name: "Nugegoda" },
          { id: "fallback-city-malabe", name: "Malabe" }
        ]
      },
      {
        id: "fallback-dist-gampaha",
        name: "Gampaha",
        cities: [
          { id: "fallback-city-gampaha", name: "Gampaha" },
          { id: "fallback-city-negombo", name: "Negombo" },
          { id: "fallback-city-kiribathgoda", name: "Kiribathgoda" },
          { id: "fallback-city-wattala", name: "Wattala" },
          { id: "fallback-city-kadawatha", name: "Kadawatha" },
          { id: "fallback-city-jaela", name: "Ja-Ela" }
        ]
      },
      {
        id: "fallback-dist-kalutara",
        name: "Kalutara",
        cities: [
          { id: "fallback-city-kalutara", name: "Kalutara" },
          { id: "fallback-city-panadura", name: "Panadura" },
          { id: "fallback-city-horana", name: "Horana" },
          { id: "fallback-city-bandaragama", name: "Bandaragama" }
        ]
      }
    ]
  },
  {
    id: "fallback-prov-central",
    name: "Central",
    districts: [
      {
        id: "fallback-dist-kandy",
        name: "Kandy",
        cities: [
          { id: "fallback-city-kandy", name: "Kandy" },
          { id: "fallback-city-gampola", name: "Gampola" },
          { id: "fallback-city-peradeniya", name: "Peradeniya" }
        ]
      },
      {
        id: "fallback-dist-matale",
        name: "Matale",
        cities: [
          { id: "fallback-city-matale", name: "Matale" },
          { id: "fallback-city-dambulla", name: "Dambulla" }
        ]
      },
      {
        id: "fallback-dist-neliya",
        name: "Nuwara Eliya",
        cities: [
          { id: "fallback-city-neliya", name: "Nuwara Eliya" },
          { id: "fallback-city-hatton", name: "Hatton" }
        ]
      }
    ]
  },
  {
    id: "fallback-prov-southern",
    name: "Southern",
    districts: [
      {
        id: "fallback-dist-galle",
        name: "Galle",
        cities: [
          { id: "fallback-city-galle", name: "Galle" },
          { id: "fallback-city-hikkaduwa", name: "Hikkaduwa" },
          { id: "fallback-city-karapitiya", name: "Karapitiya" }
        ]
      },
      {
        id: "fallback-dist-matara",
        name: "Matara",
        cities: [
          { id: "fallback-city-matara", name: "Matara" },
          { id: "fallback-city-weligama", name: "Weligama" }
        ]
      }
    ]
  }
];

// GET - Public endpoint to fetch full location hierarchy
export async function GET() {
  try {
    const provinces = await prisma.province.findMany({
      orderBy: { name: "asc" },
      include: {
        districts: {
          orderBy: { name: "asc" },
          include: {
            cities: {
              orderBy: { name: "asc" },
            },
          },
        },
      },
    });

    // Fall back to static dataset if database query returns empty array
    if (!provinces || provinces.length === 0) {
      console.warn("Locations database is empty – serving fallback static location hierarchy");
      return NextResponse.json({ provinces: FALLBACK_PROVINCES });
    }

    return NextResponse.json({ provinces });
  } catch (error) {
    console.error("Locations fetch error, serving static fallback data:", error);
    // Serve fallback static data instead of returning 500 error to keep UI working
    return NextResponse.json({ provinces: FALLBACK_PROVINCES });
  }
}
