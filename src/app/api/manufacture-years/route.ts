import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";

// GET - Public endpoint to fetch all manufacture years
export async function GET() {
  try {
    const years = await prisma.manufactureYear.findMany({
      orderBy: { year: "desc" },
      select: { id: true, year: true },
    });
    return NextResponse.json({ years });
  } catch (error) {
    console.error("Manufacture years fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch manufacture years" }, { status: 500 });
  }
}
