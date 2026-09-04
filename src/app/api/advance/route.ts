import { jsonNoStore } from "@/lib/http";
import { advancePhase } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const state = await advancePhase();
    return jsonNoStore(state);
  } catch (err) {
    return jsonNoStore(
      { error: err instanceof Error ? err.message : "Erro ao avançar." },
      { status: 400 },
    );
  }
}
