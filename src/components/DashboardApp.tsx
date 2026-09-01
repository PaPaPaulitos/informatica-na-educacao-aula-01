"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/lib/hooks";
import { getTheory } from "@/lib/theories";

type Screen = "question1" | "question2";

export function DashboardApp() {
  const { state, error, loading, setState } = useAppState();
  const [screen, setScreen] = useState<Screen>("question1");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const q1 = useMemo(() => state?.responses ?? [], [state]);
  const q2 = useMemo(
    () => (state?.responses ?? []).filter((r) => Boolean(r.question2)),
    [state],
  );

  async function advance() {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/advance", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível avançar.");
      setState(data);
      setScreen("question2");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao avançar.");
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
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível reiniciar.");
      setState(data);
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

  return (
    <div className="dashboard-shell">
      <div className="atmosphere dashboard-atmosphere" aria-hidden />

      <header className="dashboard-header">
        <div>
          <p className="brand">Informática na Educação</p>
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-controls">
          <div className="screen-switch" role="tablist" aria-label="Telas">
            <button
              type="button"
              role="tab"
              aria-selected={screen === "question1"}
              className={screen === "question1" ? "active" : ""}
              onClick={() => setScreen("question1")}
            >
              Pergunta 1
              <span className="count-pill">{state.counts.question1}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={screen === "question2"}
              className={screen === "question2" ? "active" : ""}
              onClick={() => setScreen("question2")}
            >
              Pergunta 2
              <span className="count-pill">{state.counts.question2}</span>
            </button>
          </div>

          {state.phase === "question1" ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => void advance()}
              disabled={busy}
            >
              {busy ? "Avançando…" : "Avançar para a próxima pergunta"}
            </button>
          ) : (
            <p className="phase-badge">Fase atual: pergunta 2</p>
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

      {screen === "question1" ? (
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
                ? "Avance a fase para liberar a segunda pergunta."
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
