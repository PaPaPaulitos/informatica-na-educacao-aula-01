import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { pickColor } from "./colors";
import type { AppState, Phase, PublicState, Response, TheoryId } from "./types";

const STORE_KEY = "aula:state";
const LOCK_KEY = "aula:lock";
const LOCK_TTL_MS = 4000;
const LOCK_WAIT_MS = 8000;
const TMP_PATH = path.join("/tmp", "aula-informatica-store.json");

const emptyState = (): AppState => ({
  phase: "question1",
  revision: 0,
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

function createMutex() {
  let queue: Promise<unknown> = Promise.resolve();
  return function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = queue.then(fn, fn);
    queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };
}

const memoryMutex = createMutex();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireRedisLock(redis: Redis): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < LOCK_WAIT_MS) {
    const ok = await redis.set(LOCK_KEY, "1", { nx: true, px: LOCK_TTL_MS });
    if (ok) return;
    await sleep(25 + Math.random() * 50);
  }
  throw new Error("Servidor ocupado. Tente novamente.");
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  return memoryMutex(async () => {
    const redis = getRedis();
    if (!redis) return fn();
    await acquireRedisLock(redis);
    try {
      return await fn();
    } finally {
      try {
        await redis.del(LOCK_KEY);
      } catch {
        // Lock expires via TTL if delete fails.
      }
    }
  });
}

function normalizeState(raw: AppState | null | undefined): AppState {
  if (!raw || typeof raw !== "object") return emptyState();
  return {
    phase: raw.phase === "question2" ? "question2" : "question1",
    revision: typeof raw.revision === "number" ? raw.revision : 0,
    responses: Array.isArray(raw.responses) ? raw.responses : [],
  };
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
    if (data) return normalizeState(data);
    const fresh = emptyState();
    await redis.set(STORE_KEY, fresh, { nx: true });
    const again = await redis.get<AppState>(STORE_KEY);
    return normalizeState(again ?? fresh);
  }

  const memory = normalizeState(getGlobal().memory);
  const fromTmp = await readFromTmp();
  if (fromTmp) {
    const normalized = normalizeState(fromTmp);
    if (normalized.revision > memory.revision) {
      getGlobal().memory = normalized;
      return normalized;
    }
  }

  getGlobal().memory = memory;
  return memory;
}

async function saveState(state: AppState): Promise<void> {
  getGlobal().memory = state;
  await writeToTmp(state);

  const redis = getRedis();
  if (redis) {
    await redis.set(STORE_KEY, state);
  }
}

async function mutate(
  mutator: (state: AppState) => void,
): Promise<PublicState> {
  return withLock(async () => {
    const state = await loadState();
    mutator(state);
    state.revision += 1;
    await saveState(state);
    return toPublicState(state);
  });
}

export function toPublicState(state: AppState): PublicState {
  return {
    phase: state.phase,
    revision: state.revision,
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
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    throw new Error("Escreva pelo menos algumas palavras.");
  }

  return mutate((state) => {
    if (state.phase !== "question1") {
      throw new Error("A primeira pergunta já foi encerrada.");
    }

    const existing = state.responses.find((r) => r.id === id);
    if (existing) {
      existing.question1 = trimmed;
      existing.updatedAt = Date.now();
      return;
    }

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
  });
}

export async function submitQuestion2(
  id: string,
  text: string,
  theoryId: TheoryId,
): Promise<PublicState> {
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    throw new Error("Escreva pelo menos algumas palavras.");
  }

  return mutate((state) => {
    if (state.phase !== "question2") {
      throw new Error("A segunda pergunta ainda não começou.");
    }

    const existing = state.responses.find((r) => r.id === id);
    if (!existing) {
      throw new Error("Responda a primeira pergunta antes.");
    }

    existing.question2 = trimmed;
    existing.theoryId = theoryId;
    existing.updatedAt = Date.now();
  });
}

export async function advancePhase(): Promise<PublicState> {
  return mutate((state) => {
    if (state.phase === "question1") {
      state.phase = "question2";
    }
  });
}

export async function setPhase(phase: Phase): Promise<PublicState> {
  return mutate((state) => {
    state.phase = phase;
  });
}

export async function resetState(): Promise<PublicState> {
  return mutate((state) => {
    state.phase = "question1";
    state.responses = [];
  });
}

export function usingRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}
