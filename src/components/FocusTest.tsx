// src/components/FocusTest.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  makeQuestionSet,
  type Question,
  type TestPreset,
} from "../utils/questions";
import {
  computeResults,
  getRecommendation,
  type AnswerLog,
} from "../utils/scoring";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function phaseLabel(phase: Question["phase"]) {
  if (phase === "reaction") return "Reaction";
  if (phase === "speed") return "Speed";
  return "Control";
}

function readinessLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Borderline";
  if (score >= 40) return "Poor";
  return "Very low";
}

export default function FocusTest({
  preset,
  onExit,
}: {
  preset: TestPreset;
  onExit: () => void;
}) {
  const { questions } = useMemo(() => makeQuestionSet(preset), [preset]);
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const [done, setDone] = useState(false);

  const [phaseState, setPhaseState] = useState<"waiting" | "active">("waiting");
  const delayTimeoutRef = useRef<number | null>(null);

  const [kbSelected, setKbSelected] = useState<number>(0);

  const startTimeRef = useRef<number>(Date.now());

  const q = questions[index];

  useEffect(() => {
    if (done) return;
    if (!q) return;

    setKbSelected(0);
    setTimeLeft(q.timeLimitSec);

    if (delayTimeoutRef.current) {
      window.clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    const needsDelay = Boolean(q.preDelay);
    const delayMs = needsDelay ? randInt(300, 1200) : 0;

    if (needsDelay) {
      setPhaseState("waiting");
      delayTimeoutRef.current = window.setTimeout(() => {
        startTimeRef.current = Date.now();
        setPhaseState("active");
      }, delayMs);
    } else {
      startTimeRef.current = Date.now();
      setPhaseState("active");
    }

    return () => {
      if (delayTimeoutRef.current) {
        window.clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    };
  }, [index, done, q]);

  useEffect(() => {
    if (done) return;
    if (phaseState !== "active") return;

    const interval = window.setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phaseState, done]);

  useEffect(() => {
    if (done) return;
    if (!q) return;
    if (phaseState !== "active") return;
    if (timeLeft > 0) return;

    handleAnswer(-1, true);
  }, [timeLeft, done, phaseState, q]);

  useEffect(() => {
    if (done) return;
    if (!q) return;
    if (!q.keyboard) return;
    if (phaseState !== "active") return;

    const onKeyDown = (e: KeyboardEvent) => {
      const isLeftRight =
        q.choices.length === 2 &&
        q.choices.includes("Left") &&
        q.choices.includes("Right");

      if (!isLeftRight) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setKbSelected(q.choices.indexOf("Left"));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setKbSelected(q.choices.indexOf("Right"));
      } else if (e.key === " ") {
        e.preventDefault();
        handleAnswer(kbSelected, false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [done, q, phaseState, kbSelected]);

  function handleAnswer(choiceIndex: number, timedOut: boolean) {
    if (done) return;
    if (!q) return;
    if (phaseState !== "active") return;

    const timeMs = Date.now() - startTimeRef.current;
    const correct = !timedOut && choiceIndex === q.correctIndex;

    const newLogs: AnswerLog[] = [
      ...logs,
      { qid: q.id, phase: q.phase, correct, timeMs, timedOut },
    ];
    setLogs(newLogs);

    if (index + 1 >= total) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
  }

  function reset() {
    window.location.reload();
  }

  if (!q) {
    return (
      <main
        style={{
          maxWidth: 720,
          margin: "40px auto",
          padding: 16,
          fontFamily: "system-ui",
        }}
      >
        <button onClick={onExit} style={{ marginBottom: 12 }}>
          ← Back
        </button>
        <p>Loading…</p>
      </main>
    );
  }

  if (done) {
    const result = computeResults(logs);
    const rec = getRecommendation(result);

    const pct = Math.round(result.accuracy * 100);
    const readiness = result.readinessScore;
    const readinessText = readinessLabel(readiness);

    const { alertness, mentalSpeed, selfControl } = result.signals;

    return (
      <main
        style={{
          maxWidth: 860,
          margin: "40px auto",
          padding: 16,
          fontFamily: "system-ui",
        }}
      >
        <button onClick={onExit} style={{ marginBottom: 12 }}>
          ← Back
        </button>

        <h1>Focus Result</h1>

        {/* Big verdict */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 14,
            padding: 16,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {result.profile.emoji} {result.profile.headline}
          </div>
          <div style={{ marginTop: 6, fontSize: 16, opacity: 0.9 }}>
            {result.profile.explanation}
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <b>Focus readiness:</b> {readiness} / 100 ({readinessText})
            </div>
            <div>
              <b>Confidence:</b> {result.confidence} ({result.total} questions)
            </div>
            <div>
              <b>Accuracy:</b> {result.correctTotal}/{result.total} ({pct}%)
            </div>
            <div>
              <b>Lapses:</b> {result.lapses}
            </div>
          </div>
        </div>

        {/* Signals */}
        <h2 style={{ marginTop: 18 }}>Your focus signals</h2>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {[alertness, mentalSpeed, selfControl].map((s) => (
            <div
              key={s.title}
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                {s.emoji} {s.title}: {s.level}
              </div>
              <div style={{ marginTop: 8 }}>{s.oneLiner}</div>
              <ul
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  paddingLeft: 18,
                  opacity: 0.9,
                }}
              >
                {s.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Do now / Avoid */}
        <h2 style={{ marginTop: 18 }}>What to do now</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          <div
            style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>Recommended</div>
            <ul style={{ marginTop: 10, marginBottom: 0, paddingLeft: 18 }}>
              {result.profile.doNow.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>

          <div
            style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>Avoid</div>
            <ul style={{ marginTop: 10, marginBottom: 0, paddingLeft: 18 }}>
              {result.profile.avoid.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust builder */}
        <div
          style={{
            marginTop: 16,
            border: "1px solid #f0f0f0",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 700 }}>Why this recommendation?</div>
          <ul
            style={{
              marginTop: 10,
              marginBottom: 0,
              paddingLeft: 18,
              opacity: 0.9,
            }}
          >
            {result.why.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>

        {/* Backwards compatible recommendation string */}
        <p style={{ marginTop: 16, opacity: 0.85 }}>{rec}</p>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          >
            Retake
          </button>
          <button
            onClick={onExit}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          >
            Home
          </button>
        </div>
      </main>
    );
  }

  const disabled = phaseState !== "active";

  const isReactionKeyboard =
    q.keyboard &&
    q.choices.length === 2 &&
    q.choices.includes("Left") &&
    q.choices.includes("Right");

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <button onClick={onExit} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <h1>Focus Check</h1>

      <p style={{ margin: "6px 0" }}>
        <b>Preset:</b> {preset === "mini" ? "Mini (~1 min)" : "Full (2 min)"} ·{" "}
        <b>Phase:</b> {phaseLabel(q.phase)}
      </p>

      <p style={{ margin: "6px 0" }}>
        Question {index + 1} / {total}
      </p>

      {phaseState === "waiting" ? (
        <p style={{ margin: "6px 0" }}>
          <b>Get ready…</b>
        </p>
      ) : (
        <p style={{ margin: "6px 0" }}>
          <b>Time left:</b> {timeLeft}s
        </p>
      )}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginTop: 12,
        }}
      >
        <div style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.4 }}>
          {q.prompt}
        </div>
        {isReactionKeyboard && (
          <div style={{ marginTop: 10, opacity: 0.75, fontSize: 14 }}>
            Keyboard: ← / → to select · Space to submit
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        {q.choices.map((c, i) => {
          const selected = isReactionKeyboard && i === kbSelected;

          return (
            <button
              key={`${q.id}-${i}`}
              disabled={disabled}
              onClick={() => handleAnswer(i, false)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: selected ? "2px solid #111" : "1px solid #ccc",
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                fontSize: 16,
                opacity: disabled ? 0.6 : 1,
                background: selected ? "rgba(0,0,0,0.04)" : "transparent",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <p style={{ marginTop: 14, opacity: 0.7 }}>
        If time runs out, it auto-moves to the next question.
      </p>
    </main>
  );
}
