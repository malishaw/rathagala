import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ valid: false, error: "Password is required" }, { status: 400 });
  }

  try {
    const result = await auth.api.signInEmail({
      body: { email: session.user.email, password, rememberMe: false },
      headers: new Headers(),
    });

    // Immediately revoke the newly created session to avoid session leakage
    if (result?.token) {
      await prisma.session.deleteMany({ where: { token: result.token } });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
