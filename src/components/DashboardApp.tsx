"use client";

import { useState } from "react";
import { useAppState } from "@/lib/hooks";
import { getTheory } from "@/lib/theories";
import type { Phase } from "@/lib/types";

type Screen = Phase;

export function DashboardApp() {
  const { state, error, loading, applyState } = useAppState();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [seenPhase, setSeenPhase] = useState<Phase | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (state && state.phase !== seenPhase) {
    setSeenPhase(state.phase);
    setScreen(state.phase);
  }

  const q1 = state?.responses ?? [];
  const q2 = (state?.responses ?? []).filter((r) => Boolean(r.question2));
  const visibleScreen = screen ?? state?.phase ?? "question1";

  async function advance() {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    setScreen("question2");
    try {
      const res = await fetch("/api/advance", {
        method: "POST",
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível avançar.");
      applyState(data);
      setScreen("question2");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao avançar.");
      if (state?.phase === "question1") setScreen("question1");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (
      !window.confirm(
        "Reiniciar a sessão? Todas as respostas serão apagadas.",
      )
    ) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível reiniciar.");
      applyState(data);
      setScreen("question1");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao reiniciar.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !state) {
    return (
      <div className="dashboard-shell">
        <p className="status-line">Abrindo o dashboard…</p>
      </div>
    );
  }

  const canAdvance = state.phase === "question1";

  return (
    <div className="dashboard-shell">
      <div className="atmosphere dashboard-atmosphere" aria-hidden />

      <header className="dashboard-header">
        <div>
          <p className="brand">Informática na Educação</p>
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-controls">
          <div className="screen-switch" role="tablist" aria-label="Ver respostas">
            <button
              type="button"
              role="tab"
              aria-selected={visibleScreen === "question1"}
              className={visibleScreen === "question1" ? "active" : ""}
              onClick={() => setScreen("question1")}
            >
              Ver pergunta 1
              <span className="count-pill">{state.counts.question1}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={visibleScreen === "question2"}
              className={visibleScreen === "question2" ? "active" : ""}
              onClick={() => setScreen("question2")}
            >
              Ver pergunta 2
              <span className="count-pill">{state.counts.question2}</span>
            </button>
          </div>

          {canAdvance ? (
            <button
              type="button"
              className="btn primary advance-btn"
              onClick={() => void advance()}
              disabled={busy}
            >
              {busy ? "Avançando…" : "Liberar próxima pergunta"}
            </button>
          ) : (
            <p className="phase-badge">Pergunta 2 liberada para a turma</p>
          )}

          <button
            type="button"
            className="btn ghost"
            onClick={() => void reset()}
            disabled={busy}
          >
            Reiniciar sessão
          </button>
        </div>
      </header>

      {(error || actionError) && (
        <p className="status-line error">{actionError ?? error}</p>
      )}

      {state.persistence === "memory" ? (
        <p className="status-line warn">
          Esta sessão está só na memória deste servidor. Em produção na Vercel,
          conecte o Upstash Redis para a turma inteira ver o mesmo avanço de
          pergunta.
        </p>
      ) : null}

      {visibleScreen === "question1" ? (
        <section className="wall-section animate-rise">
          <div className="wall-intro">
            <h2>O que as pessoas conhecem bem</h2>
            <p>Cada resposta recebe uma cor — a mesma cor volta na pergunta 2.</p>
          </div>
          {q1.length === 0 ? (
            <p className="empty-wall">Aguardando as primeiras respostas…</p>
          ) : (
            <div className="answer-wall">
              {q1.map((item, index) => (
                <article
                  key={item.id}
                  className="wall-card animate-pop"
                  style={{
                    color: item.color,
                    animationDelay: `${Math.min(index, 12) * 40}ms`,
                  }}
                >
                  <p>{item.question1}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="wall-section animate-rise">
          <div className="wall-intro">
            <h2>Relações com os conhecimentos</h2>
            <p>
              A cor de cada relação é a mesma da primeira resposta da pessoa.
            </p>
          </div>
          {q2.length === 0 ? (
            <p className="empty-wall">
              {state.phase === "question1"
                ? busy
                  ? "Liberando a segunda pergunta para a turma…"
                  : "Use “Liberar próxima pergunta” para a turma avançar. As abas só mudam o mural."
                : "Aguardando as relações…"}
            </p>
          ) : (
            <div className="answer-wall relations">
              {q2.map((item, index) => {
                const theory = item.theoryId
                  ? getTheory(item.theoryId)
                  : undefined;
                return (
                  <article
                    key={item.id}
                    className="wall-card relation animate-pop"
                    style={{
                      borderTopColor: item.color,
                      animationDelay: `${Math.min(index, 12) * 40}ms`,
                    }}
                  >
                    <p className="relation-knowledge" style={{ color: item.color }}>
                      {item.question1}
                    </p>
                    {theory ? (
                      <p className="relation-theory">
                        {theory.number}. {theory.title}
                      </p>
                    ) : null}
                    <p className="relation-text" style={{ color: item.color }}>
                      {item.question2}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
