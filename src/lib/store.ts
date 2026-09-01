import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { pickColor } from "./colors";
import type { AppState, Phase, PublicState, Response, TheoryId } from "./types";

const STORE_KEY = "aula:state";
const TMP_PATH = path.join("/tmp", "aula-informatica-store.json");

const emptyState = (): AppState => ({
  phase: "question1",
  responses: [],
});

type GlobalStore = {
  memory: AppState;
};

function getGlobal(): GlobalStore {
  const g = globalThis as typeof globalThis & {
    __aulaStore?: GlobalStore;
  };
  if (!g.__aulaStore) {
    g.__aulaStore = { memory: emptyState() };
  }
  return g.__aulaStore;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function readFromTmp(): Promise<AppState | null> {
  try {
    const raw = await fs.readFile(TMP_PATH, "utf8");
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

async function writeToTmp(state: AppState): Promise<void> {
  try {
    await fs.writeFile(TMP_PATH, JSON.stringify(state), "utf8");
  } catch {
    // Best-effort persistence within the same instance.
  }
}

async function loadState(): Promise<AppState> {
  const redis = getRedis();
  if (redis) {
    const data = await redis.get<AppState>(STORE_KEY);
    if (data) return data;
    const fresh = emptyState();
    await redis.set(STORE_KEY, fresh);
    return fresh;
  }

  const fromTmp = await readFromTmp();
  if (fromTmp) {
    getGlobal().memory = fromTmp;
    return fromTmp;
  }

  return getGlobal().memory;
}

async function saveState(state: AppState): Promise<void> {
  getGlobal().memory = state;
  await writeToTmp(state);

  const redis = getRedis();
  if (redis) {
    await redis.set(STORE_KEY, state);
  }
}

export function toPublicState(state: AppState): PublicState {
  return {
    phase: state.phase,
    responses: state.responses.map((r) => ({
      id: r.id,
      color: r.color,
      question1: r.question1,
      question2: r.question2,
      theoryId: r.theoryId,
    })),
    counts: {
      question1: state.responses.length,
      question2: state.responses.filter((r) => Boolean(r.question2)).length,
    },
  };
}

export async function getPublicState(): Promise<PublicState> {
  return toPublicState(await loadState());
}

export async function submitQuestion1(
  id: string,
  text: string,
): Promise<PublicState> {
  const state = await loadState();
  if (state.phase !== "question1") {
    throw new Error("A primeira pergunta já foi encerrada.");
  }

  const trimmed = text.trim();
  if (trimmed.length < 2) {
    throw new Error("Escreva pelo menos algumas palavras.");
  }

  const existing = state.responses.find((r) => r.id === id);
  if (existing) {
    existing.question1 = trimmed;
    existing.updatedAt = Date.now();
  } else {
    const used = state.responses.map((r) => r.color);
    const now = Date.now();
    const response: Response = {
      id,
      color: pickColor(used),
      question1: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    state.responses.push(response);
  }

  await saveState(state);
  return toPublicState(state);
}

export async function submitQuestion2(
  id: string,
  text: string,
  theoryId: TheoryId,
): Promise<PublicState> {
  const state = await loadState();
  if (state.phase !== "question2") {
    throw new Error("A segunda pergunta ainda não começou.");
  }

  const trimmed = text.trim();
  if (trimmed.length < 2) {
    throw new Error("Escreva pelo menos algumas palavras.");
  }

  const existing = state.responses.find((r) => r.id === id);
  if (!existing) {
    throw new Error("Responda a primeira pergunta antes.");
  }

  existing.question2 = trimmed;
  existing.theoryId = theoryId;
  existing.updatedAt = Date.now();

  await saveState(state);
  return toPublicState(state);
}

export async function advancePhase(): Promise<PublicState> {
  const state = await loadState();
  if (state.phase === "question1") {
    state.phase = "question2";
  }
  await saveState(state);
  return toPublicState(state);
}

export async function setPhase(phase: Phase): Promise<PublicState> {
  const state = await loadState();
  state.phase = phase;
  await saveState(state);
  return toPublicState(state);
}

export async function resetState(): Promise<PublicState> {
  const fresh = emptyState();
  await saveState(fresh);
  return toPublicState(fresh);
}

export function usingRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}
