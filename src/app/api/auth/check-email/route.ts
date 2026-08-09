export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { exists: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
      columns: { id: true, email: true },
    });

    return NextResponse.json({
      exists: !!existingUser,
    });
  } catch (error) {
    console.error("Error checking user email:", error);
    return NextResponse.json(
      { exists: false, error: "Failed to check email" },
      { status: 500 }
    );
  }
}
