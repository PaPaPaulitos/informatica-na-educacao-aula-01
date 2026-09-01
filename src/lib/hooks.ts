"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PublicState } from "@/lib/types";

const POLL_MS = 1500;
const SESSION_KEY = "aula-participant-id";

export function useAppState() {
  const [state, setState] = useState<PublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar o estado.");
      const data = (await res.json()) as PublicState;
      if (!mounted.current) return;
      setState(data);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

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
      window.clearInterval(interval);
      window.clearTimeout(initial);
    };
  }, [refresh]);

  return { state, error, loading, refresh, setState };
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
