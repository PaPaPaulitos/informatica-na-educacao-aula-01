import { NextResponse } from "next/server";
import { getPublicState, usingRedis } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getPublicState();
  return NextResponse.json({
    ...state,
    persistence: usingRedis() ? "redis" : "memory",
  });
}
