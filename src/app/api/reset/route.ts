import { jsonNoStore } from "@/lib/http";
import { resetState } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const state = await resetState();
    return jsonNoStore(state);
  } catch (err) {
    return jsonNoStore(
      { error: err instanceof Error ? err.message : "Erro ao reiniciar." },
      { status: 400 },
    );
  }
}
