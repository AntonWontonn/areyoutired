"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { makeQuestionSet, type Question } from "../utils/questions";
import { computeResults, getRecommendation, type AnswerLog } from "../utils/scoring";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FocusTest() {
  const questions = useMemo(() => makeQuestionSet(15), []);
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [done, setDone] = useState(false);

  const secondsForQuestion = useRef<number>(30);
  const startTimeRef = useRef<number>(Date.now());

  const q: Question = questions[index];

  // Start timer per question
  useEffect(() => {
    if (done) return;

    // fixed:
    // secondsForQuestion.current = 30;

    // random:
    secondsForQuestion.current = randInt(20, 45);

    setTimeLeft(secondsForQuestion.current);
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [index, done]);

  // Auto-advance if timer hits 0 (counts as wrong)
  useEffect(() => {
    if (done) return;
    if (timeLeft > 0) return;

    handleAnswer(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, done]);

  function handleAnswer(choiceIndex: number) {
    if (done) return;

    const timeMs = Date.now() - startTimeRef.current;
    const correct = choiceIndex === q.correctIndex;

    const newLogs = [...logs, { qid: q.id, correct, timeMs }];
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

  if (done) {
    const { correctCount, accuracy, avgMs, score } = computeResults(logs, total);

    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1>Focus Result</h1>
        <p>
          <b>Accuracy:</b> {correctCount}/{total} ({Math.round(accuracy * 100)}%)
        </p>
        <p>
          <b>Avg response time:</b> {avgMs} ms
        </p>
        <p>
          <b>Focus score:</b> {Math.round(score * 100)} / 100
        </p>
        <h2 style={{ marginTop: 20 }}>{getRecommendation(score)}</h2>
        <button onClick={reset} style={{ marginTop: 16, padding: "10px 14px" }}>
          Retake
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Focus Check</h1>
      <p>
        Question {index + 1} / {total}
      </p>
      <p>
        <b>Time left:</b> {timeLeft}s
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 12 }}>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 20, margin: 0 }}>{q.prompt}</pre>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        {q.choices.map((c, i) => (
          <button
            key={`${q.id}-${i}`}
            onClick={() => handleAnswer(i)}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 16,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 14, opacity: 0.7 }}>If time runs out, it auto-moves to the next question.</p>
    </main>
  );
}
