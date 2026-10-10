"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  makeQuestionSet,
  type Question,
  type TestPreset,
} from "../utils/questions";

import type { AnswerLog } from "../utils/scoring";

import TestHeader from "./TestHeader";
import PhaseIntro from "./PhaseIntro";
import ReactionQuestion from "./ReactionQuestion";
import DSSTQuestion from "./DSSTQuestion";
import GoNoGoQuestion from "./GoNoGoQuestion";
import ResultsScreen from "./ResultsScreen";
import PracticeScreen from "./PracticeScreen";
import KSSScreen from "./KSSScreen";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FocusTest({
  preset,
  onExit,
}: {
  preset: TestPreset;
  onExit: () => void;
}) {
  const testPack = useMemo(() => makeQuestionSet(preset), [preset]);

  const questions = testPack.questions;
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [done, setDone] = useState(false);

  const [showIntro, setShowIntro] = useState(true);
  const [showPractice, setShowPractice] = useState(false);

  const [phaseState, setPhaseState] = useState<
    "waiting" | "active" | "feedback"
  >("waiting");

  const [kss, setKss] = useState<number | null>(null);

  const [showKss, setShowKss] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);

  const streakRef = useRef(0);

  const delayTimeoutRef = useRef<number | null>(null);

  const answerTimeoutRef = useRef<number | null>(null);

  const feedbackTimeoutRef = useRef<number | null>(null);

  const startTimeRef = useRef(0);

  const answeredRef = useRef(false);

  const q = questions[index];

  const phaseQuestions = questions.filter(
    (question) => question.phase === q.phase,
  );

  const phaseIndex = questions
    .slice(0, index + 1)
    .filter((question) => question.phase === q.phase).length;

  function finishKss(value: number) {
    setKss(value);
    setShowKss(false);
  }

  function getControlFeedback(
    trialKind: "go" | "nogo",
    responseMade: boolean,
    nextStreak: number,
  ) {
    if (nextStreak >= 5) {
      return "Locked in";
    }

    if (nextStreak >= 3) {
      return "Nice streak";
    }

    if (trialKind === "go" && responseMade) {
      return "Nice";
    }

    if (trialKind === "go" && !responseMade) {
      return "Missed it";
    }

    if (trialKind === "nogo" && !responseMade) {
      return "Nice hold";
    }

    return "Almost";
  }

  const clearTimers = useCallback(() => {
    if (delayTimeoutRef.current !== null) {
      window.clearTimeout(delayTimeoutRef.current);

      delayTimeoutRef.current = null;
    }

    if (answerTimeoutRef.current !== null) {
      window.clearTimeout(answerTimeoutRef.current);

      answerTimeoutRef.current = null;
    }

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);

      feedbackTimeoutRef.current = null;
    }
  }, []);

  const moveToNextQuestion = useCallback(
    (currentQuestion: Question) => {
      if (index + 1 >= total) {
        clearTimers();
        setDone(true);
        return;
      }

      const nextQuestion = questions[index + 1];

      // Hide the task before switching to the next question.
      setPhaseState("waiting");

      setIndex((i) => i + 1);

      if (nextQuestion.phase !== currentQuestion.phase) {
        setShowIntro(true);
      }
    },
    [index, questions, total, clearTimers],
  );

  const finishControlTrial = useCallback(
    (
      currentQuestion: Extract<Question, { type: "gonogo" }>,
      correct: boolean,
      timedOut: boolean,
      timeMs: number,
      responseMade: boolean,
    ) => {
      if (answeredRef.current) {
        return;
      }

      answeredRef.current = true;

      clearTimers();

      const nextStreak = correct ? streakRef.current + 1 : 0;

      streakRef.current = nextStreak;

      const message = getControlFeedback(
        currentQuestion.trialKind,
        responseMade,
        nextStreak,
      );

      setLogs((previousLogs) => [
        ...previousLogs,
        {
          qid: currentQuestion.id,
          phase: currentQuestion.phase,
          type: currentQuestion.type,

          correct,
          timeMs,

          timedOut,
          responseMade,

          trialKind: currentQuestion.trialKind,

          commissionError: currentQuestion.trialKind === "nogo" && responseMade,

          omissionError: currentQuestion.trialKind === "go" && !responseMade,
        },
      ]);

      setPhaseState("feedback");
      setFeedback(message);

      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedback(null);

        moveToNextQuestion(currentQuestion);
      }, 500);
    },
    [clearTimers, moveToNextQuestion],
  );

  const finishQuestion = useCallback(
    (
      currentQuestion: Question,
      correct: boolean,
      timedOut: boolean,
      timeMs: number,
      responseMade: boolean,
    ) => {
      if (answeredRef.current) {
        return;
      }

      answeredRef.current = true;

      clearTimers();

      const newLog: AnswerLog = {
        qid: currentQuestion.id,
        phase: currentQuestion.phase,
        type: currentQuestion.type,

        correct,
        timeMs,

        timedOut,
        responseMade,
      };

      setLogs((previousLogs) => [...previousLogs, newLog]);

      moveToNextQuestion(currentQuestion);
    },
    [clearTimers, moveToNextQuestion],
  );

  const handleTimeout = useCallback(
    (currentQuestion: Question) => {
      if (currentQuestion.type === "gonogo") {
        const correct = currentQuestion.trialKind === "nogo";

        finishControlTrial(
          currentQuestion,
          correct,

          currentQuestion.trialKind === "go",

          currentQuestion.timeLimitMs,

          false,
        );

        return;
      }

      finishQuestion(
        currentQuestion,
        false,
        true,
        currentQuestion.timeLimitMs,
        false,
      );
    },
    [finishQuestion, finishControlTrial],
  );

  const activateQuestion = useCallback(
    (currentQuestion: Question) => {
      answeredRef.current = false;

      setPhaseState("active");

      startTimeRef.current = performance.now();

      answerTimeoutRef.current = window.setTimeout(() => {
        handleTimeout(currentQuestion);
      }, currentQuestion.timeLimitMs);
    },
    [handleTimeout],
  );

  useEffect(() => {
    if (done || !q || showKss || showIntro || showPractice) {
      return;
    }

    clearTimers();

    setPhaseState("waiting");

    if (q.type === "rt_compare" && q.preDelay) {
      const delayMs = randInt(300, 1200);

      delayTimeoutRef.current = window.setTimeout(() => {
        activateQuestion(q);
      }, delayMs);

      return clearTimers;
    }

    activateQuestion(q);

    return clearTimers;
  }, [
    index,
    showKss,
    showIntro,
    showPractice,
    done,
    q,
    activateQuestion,
    clearTimers,
  ]);

  function startPractice() {
    clearTimers();

    answeredRef.current = false;

    setShowPractice(true);
  }

  function finishPractice() {
    clearTimers();

    answeredRef.current = false;

    setShowPractice(false);
    setShowIntro(false);
  }

  function leavePractice() {
    clearTimers();

    answeredRef.current = false;

    setShowPractice(false);
  }

  function startPhase() {
    clearTimers();

    answeredRef.current = false;

    setShowIntro(false);
  }

  function handleRegularAnswer(choiceIndex: number) {
    if (!q || phaseState !== "active") {
      return;
    }

    if (answeredRef.current) {
      return;
    }

    if (q.type === "gonogo") {
      return;
    }

    const timeMs = performance.now() - startTimeRef.current;

    const correct = choiceIndex === q.correctIndex;

    finishQuestion(q, correct, false, timeMs, true);
  }

  function handleGoNoGoResponse() {
    if (!q || q.type !== "gonogo") {
      return;
    }

    if (phaseState !== "active") {
      return;
    }

    if (answeredRef.current) {
      return;
    }

    const timeMs = performance.now() - startTimeRef.current;

    const correct = q.trialKind === "go";

    finishControlTrial(q, correct, false, timeMs, true);
  }

  function reset() {
    window.location.reload();
  }

  function skipKss() {
    setKss(null);
    setShowKss(false);
  }

  if (showKss) {
    return (
      <KSSScreen onContinue={finishKss} onSkip={skipKss} onBack={onExit} />
    );
  }

  if (done) {
    return (
      <ResultsScreen
        logs={logs}
        preset={preset}
        kss={kss}
        onRetake={reset}
        onExit={onExit}
      />
    );
  }

  if (!q) {
    return <p>Loading...</p>;
  }

  if (showPractice) {
    return (
      <PracticeScreen
        phase={q.phase}
        dsstKey={testPack.meta.dsstKey}
        onDone={finishPractice}
        onBack={leavePractice}
      />
    );
  }

  if (showIntro) {
    return (
      <main className="test-page">
        <button className="back-button" onClick={onExit}>
          ← Back
        </button>

        <PhaseIntro
          phase={q.phase}
          onStart={startPhase}
          onPractice={startPractice}
        />
      </main>
    );
  }

  return (
    <main className="test-page">
      <TestHeader
        preset={preset}
        phase={q.phase}
        index={phaseIndex - 1}
        total={phaseQuestions.length}
        waiting={phaseState === "waiting"}
        onExit={onExit}
      />

      {q.type === "rt_compare" && (
        <ReactionQuestion
          question={q}
          disabled={phaseState !== "active"}
          onAnswer={handleRegularAnswer}
        />
      )}

      {q.type === "dsst" && (
        <DSSTQuestion
          question={q}
          dsstKey={testPack.meta.dsstKey}
          disabled={phaseState !== "active"}
          onAnswer={handleRegularAnswer}
        />
      )}

      {q.type === "gonogo" && (
        <GoNoGoQuestion
          question={q}
          disabled={phaseState !== "active"}
          feedback={feedback}
          onRespond={handleGoNoGoResponse}
        />
      )}
    </main>
  );
}
