export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sizeRes = await db.execute(sql`SELECT pg_database_size(current_database()) as size`);
    const size = sizeRes[0]?.size || 0;
    
    return NextResponse.json({
      dataSize: Number(size),
      storageSize: Number(size),
      collections: 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to retrieve database stats" }, { status: 500 });
  }
}
