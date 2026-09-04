"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PublicState } from "@/lib/types";

const POLL_MS = 1500;
const SESSION_KEY = "aula-participant-id";

function isNewerState(prev: PublicState | null, next: PublicState): boolean {
  if (!prev) return true;
  const prevRev = typeof prev.revision === "number" ? prev.revision : -1;
  const nextRev = typeof next.revision === "number" ? next.revision : -1;
  return nextRev >= prevRev;
}

export function useAppState() {
  const [state, setState] = useState<PublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const applyState = useCallback((data: PublicState) => {
    setState((prev) => (isNewerState(prev, data) ? data : prev));
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/state?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { "Cache-Control": "no-store" },
      });
      if (!res.ok) throw new Error("Falha ao carregar o estado.");
      const data = (await res.json()) as PublicState;
      if (!mounted.current) return;
      applyState(data);
    } catch (err) {
      if (!mounted.current) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    mounted.current = true;
    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
      window.clearInterval(interval);
      window.clearTimeout(initial);
    };
  }, [refresh]);

  return { state, error, loading, refresh, applyState };
}

function readParticipantId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function useParticipantId(): string {
  return useSyncExternalStore(
    () => () => {},
    readParticipantId,
    () => "",
  );
}
