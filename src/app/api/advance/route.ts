import { NextResponse } from "next/server";
import { advancePhase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const state = await advancePhase();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao avançar." },
      { status: 400 },
    );
  }
}
