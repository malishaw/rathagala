import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";

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

    return NextResponse.json({ provinces });
  } catch (error) {
    console.error("Locations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
