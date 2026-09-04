import { jsonNoStore } from "@/lib/http";
import { submitQuestion1, submitQuestion2 } from "@/lib/store";
import type { TheoryId } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const THEORY_IDS: TheoryId[] = [
  "carga-cognitiva",
  "zdp",
  "reforco-variavel",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      question?: 1 | 2;
      text?: string;
      theoryId?: TheoryId;
    };

    if (!body.id || !body.text || !body.question) {
      return jsonNoStore(
        { error: "Dados incompletos." },
        { status: 400 },
      );
    }

    if (body.question === 1) {
      const state = await submitQuestion1(body.id, body.text);
      return jsonNoStore(state);
    }

    if (!body.theoryId || !THEORY_IDS.includes(body.theoryId)) {
      return jsonNoStore(
        { error: "Selecione um dos três conhecimentos." },
        { status: 400 },
      );
    }

    const state = await submitQuestion2(body.id, body.text, body.theoryId);
    return jsonNoStore(state);
  } catch (err) {
    return jsonNoStore(
      { error: err instanceof Error ? err.message : "Erro ao salvar." },
      { status: 400 },
    );
  }
}
