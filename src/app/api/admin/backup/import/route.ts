export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ error: "Not Implemented" }, { status: 501 }); }
export async function POST() { return NextResponse.json({ error: "Not Implemented" }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: "Not Implemented" }, { status: 501 }); }
export async function PUT() { return NextResponse.json({ error: "Not Implemented" }, { status: 501 }); }
