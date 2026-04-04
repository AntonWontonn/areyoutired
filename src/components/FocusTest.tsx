"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { makeQuestionSet, type Question } from "../utils/questions";
import {
  computeResults,
  getRecommendation,
  type AnswerLog,
} from "../utils/scoring";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FocusTest() {
  const [started, setStarted] = useState(false);
  const questions = useMemo(() => makeQuestionSet(18), []);
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
    const { correctCount, accuracy, avgMs, score } = computeResults(
      logs,
      total,
    );

    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cozy Gradient Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1f1f2e 0%, #3d3d52 25%, #1f1f2e 50%, #2d2d42 75%, #1f1f2e 100%)",
          }}
        />

        {/* Warm overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-transparent to-amber-900/20" />

        {/* Decorative ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-white text-5xl font-extrabold mb-3 drop-shadow-lg">
            Focus Result
          </h1>

          <div className="h-1 w-24 bg-gradient-to-r from-orange-400 to-amber-400 mx-auto mb-8 rounded-full" />

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30 space-y-4">
            <p className="text-amber-50 text-xl">
              <span className="text-orange-300 font-semibold">Accuracy:</span>{" "}
              {correctCount}/{total} ({Math.round(accuracy * 100)}%)
            </p>
            <p className="text-amber-50 text-xl">
              <span className="text-orange-300 font-semibold">
                Avg response time:
              </span>{" "}
              {avgMs} ms
            </p>
            <p className="text-amber-50 text-xl">
              <span className="text-orange-300 font-semibold">
                Focus score:
              </span>{" "}
              {Math.round(score * 100)} / 100
            </p>
          </div>

          <h2 className="text-amber-100 text-2xl mt-10 mb-8">
            {getRecommendation(score)}
          </h2>

          <button
            onClick={reset}
            className="
              px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500
              text-white font-semibold
              transition-all duration-300 ease-out
              hover:-translate-y-2 hover:shadow-2xl
              active:translate-y-0 active:scale-95
              shadow-lg
            "
            style={{
              boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 30px rgba(249, 115, 22, 0.8), 0 0 60px rgba(217, 119, 6, 0.6), 0 4px 15px rgba(249, 115, 22, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(249, 115, 22, 0.3)";
            }}
          >
            Retake Test
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cozy Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1f1f2e 0%, #3d3d52 25%, #1f1f2e 50%, #2d2d42 75%, #1f1f2e 100%)",
        }}
      />

      {/* Warm overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-transparent to-amber-900/20" />

      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-extrabold mb-2 drop-shadow-lg">
            Focus Check
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-orange-400 to-amber-400 mx-auto rounded-full" />
        </div>

        {/* Question Info */}
        <div className="flex justify-between items-center mb-8 text-amber-100">
          <p className="text-lg">
            Question{" "}
            <span className="text-orange-300 font-bold">{index + 1}</span> /{" "}
            {total}
          </p>
          <p className="text-xl font-semibold">
            <span
              className={`px-4 py-2 rounded-lg ${timeLeft <= 10 ? "bg-red-500/50 text-red-100" : "bg-orange-500/50 text-orange-100"}`}
            >
              {timeLeft}s
            </span>
          </p>
        </div>

        {/* Question Box */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30 mb-8 hover:border-orange-400/60 transition-all duration-300">
          <pre className="text-amber-50 text-2xl whitespace-pre-wrap font-medium">
            {q.prompt}
          </pre>
        </div>

        {/* Answer Choices */}
        <div className="space-y-4">
          {q.choices.map((c, i) => (
            <button
              key={`${q.id}-${i}`}
              onClick={() => handleAnswer(i)}
              className="
                w-full px-6 py-4 rounded-xl text-left text-lg font-medium
                bg-gradient-to-r from-slate-700/60 to-slate-800/60
                text-amber-50
                border border-orange-400/40
                cursor-pointer
                transition-all duration-200
                hover:from-slate-600/80 hover:to-slate-700/80
                hover:border-orange-400/80
                hover:shadow-lg hover:shadow-orange-500/20
                active:scale-95 active:from-orange-600/60 active:to-orange-700/60
                active:shadow-orange-500/40 active:shadow-lg
              "
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(249, 115, 22, 0.4), inset 0 0 15px rgba(249, 115, 22, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="text-center text-amber-200/70 text-sm mt-8">
          If time runs out, it auto-moves to the next question.
        </p>
      </div>
    </main>
  );
}
