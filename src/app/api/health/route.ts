import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Check database connectivity
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.database = "up";
  } catch {
    checks.database = "down";
    healthy = false;
  }

  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: checks,
    },
    { status }
  );
}
