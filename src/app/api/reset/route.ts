import { NextResponse } from "next/server";
import { resetState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const state = await resetState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao reiniciar." },
      { status: 400 },
    );
  }
}
