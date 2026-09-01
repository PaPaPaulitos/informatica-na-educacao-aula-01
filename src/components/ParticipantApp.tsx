"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { getOrCreateParticipantId, useAppState } from "@/lib/hooks";
import { THEORIES } from "@/lib/theories";
import type { PublicState, TheoryId } from "@/lib/types";

export function ParticipantApp() {
  const { state, error, loading, setState } = useAppState();
  const [participantId, setParticipantId] = useState("");

  useEffect(() => {
    setParticipantId(getOrCreateParticipantId());
  }, []);

  const mine = useMemo(
    () => state?.responses.find((r) => r.id === participantId),
    [state, participantId],
  );

  if (loading || !state || !participantId) {
    return (
      <Shell>
        <p className="status-line">Carregando a aula…</p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <p className="status-line error">{error}</p>
      </Shell>
    );
  }

  if (state.phase === "question1") {
    if (mine?.question1) {
      return (
        <Shell>
          <WaitingPanel
            color={mine.color}
            title="Resposta enviada"
            body="Aguarde o professor avançar para a próxima pergunta."
            preview={mine.question1}
          />
        </Shell>
      );
    }

    return (
      <Shell>
        <QuestionOneForm
          onSubmitted={(next) => setState(next)}
          participantId={participantId}
        />
      </Shell>
    );
  }

  // phase === question2
  if (!mine?.question1) {
    return (
      <Shell>
        <WaitingPanel
          title="Aula em andamento"
          body="A primeira pergunta já foi encerrada. Você chegou depois do início — acompanhe pelo dashboard."
        />
      </Shell>
    );
  }

  if (mine.question2) {
    return (
      <Shell>
        <WaitingPanel
          color={mine.color}
          title="Obrigado!"
          body="Sua relação foi enviada. Veja o mural no dashboard."
          preview={mine.question2}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <QuestionTwoForm
        color={mine.color}
        knowledge={mine.question1}
        onSubmitted={(next) => setState(next)}
        participantId={participantId}
      />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <div className="atmosphere" aria-hidden />
      <header className="brand-bar">
        <p className="brand">Informática na Educação</p>
        <p className="brand-sub">Aula 01 · conhecimentos em diálogo</p>
      </header>
      <main className="page-main">{children}</main>
    </div>
  );
}

function WaitingPanel({
  title,
  body,
  preview,
  color,
}: {
  title: string;
  body: string;
  preview?: string;
  color?: string;
}) {
  return (
    <section className="panel waiting-panel animate-rise">
      <div className="pulse-dot" style={{ background: color ?? "#1F6F6B" }} />
      <h1>{title}</h1>
      <p>{body}</p>
      {preview ? (
        <blockquote className="answer-preview" style={{ borderColor: color }}>
          <span style={{ color }}>{preview}</span>
        </blockquote>
      ) : null}
    </section>
  );
}

function QuestionOneForm({
  participantId,
  onSubmitted,
}: {
  participantId: string;
  onSubmitted: (state: PublicState) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: participantId, question: 1, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível enviar.");
      onSubmitted(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel question-panel animate-rise">
      <p className="step-label">Pergunta 1</p>
      <h1>Escreva algo que você conheça bem</h1>
      <p className="lead">
        Pode ser um hobby, um conceito, um ofício, um jogo — o que for seu.
      </p>
      <form onSubmit={onSubmit} className="answer-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Eu conheço bem…"
          rows={5}
          required
          minLength={2}
          disabled={busy}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn primary" disabled={busy || text.trim().length < 2}>
          {busy ? "Enviando…" : "Enviar resposta"}
        </button>
      </form>
    </section>
  );
}

function QuestionTwoForm({
  participantId,
  knowledge,
  color,
  onSubmitted,
}: {
  participantId: string;
  knowledge: string;
  color: string;
  onSubmitted: (state: PublicState) => void;
}) {
  const [theoryId, setTheoryId] = useState<TheoryId | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!theoryId) {
      setError("Escolha um dos três conhecimentos.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participantId,
          question: 2,
          text,
          theoryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível enviar.");
      onSubmitted(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel question-panel wide animate-rise">
      <p className="step-label">Pergunta 2</p>
      <h1>Relacione o que você conhece bem</h1>
      <p className="lead">
        Escolha um dos três conhecimentos abaixo e diga como ele se conecta com
        o que você escreveu.
      </p>

      <blockquote className="answer-preview" style={{ borderColor: color }}>
        <span className="preview-label">Seu conhecimento</span>
        <span style={{ color }}>{knowledge}</span>
      </blockquote>

      <form onSubmit={onSubmit} className="answer-form">
        <div className="theory-grid">
          {THEORIES.map((theory) => {
            const selected = theoryId === theory.id;
            return (
              <button
                key={theory.id}
                type="button"
                className={`theory-card ${selected ? "selected" : ""}`}
                onClick={() => setTheoryId(theory.id)}
                style={
                  selected
                    ? {
                        borderColor: color,
                        boxShadow: `0 0 0 2px ${color}33`,
                      }
                    : undefined
                }
              >
                <span className="theory-num">{theory.number}</span>
                <strong>{theory.title}</strong>
                <em>{theory.author}</em>
                <p>{theory.body}</p>
              </button>
            );
          })}
        </div>

        <label className="field-label" htmlFor="relation">
          Sua relação
        </label>
        <textarea
          id="relation"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Isso se relaciona porque…"
          rows={5}
          required
          minLength={2}
          disabled={busy}
          style={{ caretColor: color }}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button
          type="submit"
          className="btn primary"
          disabled={busy || !theoryId || text.trim().length < 2}
          style={{ background: color }}
        >
          {busy ? "Enviando…" : "Enviar relação"}
        </button>
      </form>
    </section>
  );
}
