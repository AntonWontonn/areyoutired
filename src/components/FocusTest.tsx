"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { makeQuestionSet, type Question, type TestPreset } from "../utils/questions";
import { computeResults, getRecommendation, type AnswerLog } from "../utils/scoring";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function phaseLabel(phase: Question["phase"]) {
  if (phase === "reaction") return "Reaction";
  if (phase === "speed") return "Speed";
  return "Control";
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

  // Small delay state for reaction tasks
  const [phaseState, setPhaseState] = useState<"waiting" | "active">("waiting");
  const delayTimeoutRef = useRef<number | null>(null);

  // Keyboard selection for reaction tasks (Left/Right)
  const [kbSelected, setKbSelected] = useState<number>(0);

  const startTimeRef = useRef<number>(Date.now());

  const q = questions[index];

  // Initialize question: time limit + optional pre-delay
  useEffect(() => {
    if (done) return;
    if (!q) return;

    // reset selection each question
    setKbSelected(0);

    // set timer
    setTimeLeft(q.timeLimitSec);

    // clear any old delay
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

  // Countdown runs only when active
  useEffect(() => {
    if (done) return;
    if (phaseState !== "active") return;

    const interval = window.setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phaseState, done]);

  // Timeout auto-advance (counts as wrong)
  useEffect(() => {
    if (done) return;
    if (!q) return;
    if (phaseState !== "active") return;
    if (timeLeft > 0) return;

    handleAnswer(-1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, done, phaseState, q]);

  // Keyboard handling for reaction phase (Arrow keys select, Space submits)
  useEffect(() => {
    if (done) return;
    if (!q) return;
    if (!q.keyboard) return;
    if (phaseState !== "active") return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Only handle for 2-choice reaction tasks
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
        // Spacebar submits selection
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
      {
        qid: q.id,
        phase: q.phase,
        correct,
        timeMs,
        timedOut,
      },
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
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
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
    const med = Math.round(result.med);

    const r = result.phase.reaction;
    const s = result.phase.speed;
    const c = result.phase.control;

    function pctSigned(x: number) {
      const v = Math.round(x * 100);
      return (v >= 0 ? "+" : "") + v + "%";
    }

    return (
      <main style={{ maxWidth: 820, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <button onClick={onExit} style={{ marginBottom: 12 }}>
          ← Back
        </button>

        <h1>Focus Result</h1>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 12 }}>
          <p style={{ marginTop: 0 }}>
            <b>Overall:</b> {result.correctTotal}/{result.total} ({pct}%) · <b>Median RT:</b> {med} ms ·{" "}
            <b>Lapses:</b> {result.lapses}
          </p>

          <p style={{ margin: "10px 0 0 0" }}>
            <b>Phase scores:</b>{" "}
            Reaction {result.scores.reactionScore} · Speed {result.scores.speedScore} · Control{" "}
            {result.scores.controlScore} · <b>Total</b> {result.scores.overallScore}
          </p>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <b>Reaction</b>
            <div>Accuracy: {Math.round(r.accuracy * 100)}%</div>
            <div>Median RT: {Math.round(r.med)} ms</div>
            <div>Slowdown: {pctSigned(r.slowdownPct)}</div>
            <div>Lapses: {r.lapses}</div>
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <b>Speed (DSST)</b>
            <div>Accuracy: {Math.round(s.accuracy * 100)}%</div>
            <div>Median RT: {Math.round(s.med)} ms</div>
            <div>Slowdown: {pctSigned(s.slowdownPct)}</div>
            <div>Lapses: {s.lapses}</div>
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <b>Control (Go/No-Go)</b>
            <div>Accuracy: {Math.round(c.accuracy * 100)}%</div>
            <div>Median RT: {Math.round(c.med)} ms</div>
            <div>Slowdown: {pctSigned(c.slowdownPct)}</div>
            <div>Lapses: {c.lapses}</div>
          </div>
        </div>

        <h2 style={{ marginTop: 18 }}>{rec}</h2>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={reset} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc" }}>
            Retake
          </button>
          <button onClick={onExit} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc" }}>
            Home
          </button>
        </div>
      </main>
    );
  }

  const disabled = phaseState !== "active";

  // Keyboard hint only when it actually applies
  const isReactionKeyboard =
    q.keyboard &&
    q.choices.length === 2 &&
    q.choices.includes("Left") &&
    q.choices.includes("Right");

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
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

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 12 }}>
        <div style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.4 }}>{q.prompt}</div>
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
