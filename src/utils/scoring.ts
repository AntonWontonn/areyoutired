// src/utils/scoring.ts
import type { Phase } from "./questions";

export type AnswerLog = {
  qid: string;
  phase: Phase;
  correct: boolean;
  timeMs: number;
  timedOut: boolean;
};

type PhaseSummary = {
  accuracy: number;
  med: number;
  sd: number;
  lapses: number;
  slowdownPct: number;
};

type InterpretedSignal = {
  title: string;
  level: "Great" | "Good" | "Okay" | "Low";
  emoji: "✅" | "🙂" | "🟡" | "🔴";
  oneLiner: string;
  details: string[];
  score0to3: 0 | 1 | 2 | 3;
};

type Profile = {
  headline: string; // big verdict
  emoji: "✅" | "🙂" | "🟡" | "🟠" | "🔴";
  explanation: string; // one sentence
  doNow: string[];
  avoid: string[];
};

type Confidence = "Low" | "Medium" | "High";

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}

function stddev(xs: number[]) {
  if (xs.length <= 1) return 0;
  const m = mean(xs);
  const v = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function median(xs: number[]) {
  if (xs.length === 0) return 0;
  const a = xs.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function phaseSummary(logs: AnswerLog[]): PhaseSummary {
  const total = logs.length || 1;
  const correctCount = logs.filter((l) => l.correct && !l.timedOut).length;
  const accuracy = correctCount / total;

  const rts = logs.filter((l) => !l.timedOut).map((l) => l.timeMs);
  const med = median(rts);
  const sd = stddev(rts);

  const lapses = logs.filter((l) => l.timedOut || l.timeMs > 2500).length;

  // slowdown using thirds (negative = faster later, positive = slower later)
  const rtsOrdered = logs.filter((l) => !l.timedOut).map((l) => l.timeMs);
  const n = rtsOrdered.length;
  const third = Math.max(1, Math.floor(n / 3));
  const first = rtsOrdered.slice(0, third);
  const last = rtsOrdered.slice(Math.max(0, n - third));
  const firstMed = median(first);
  const lastMed = median(last);
  const slowdownPct = firstMed > 0 ? (lastMed - firstMed) / firstMed : 0;

  return { accuracy, med, sd, lapses, slowdownPct };
}

function trendLabel(slowdownPct: number) {
  if (slowdownPct > 0.12) return "Slowing down";
  if (slowdownPct < -0.12) return "Speeding up";
  return "Steady";
}

function levelFromScore(score0to3: 0 | 1 | 2 | 3): InterpretedSignal["level"] {
  if (score0to3 === 3) return "Great";
  if (score0to3 === 2) return "Good";
  if (score0to3 === 1) return "Okay";
  return "Low";
}

function emojiFromScore(score0to3: 0 | 1 | 2 | 3): InterpretedSignal["emoji"] {
  if (score0to3 === 3) return "✅";
  if (score0to3 === 2) return "🙂";
  if (score0to3 === 1) return "🟡";
  return "🔴";
}

function interpretAlertness(reaction: PhaseSummary): InterpretedSignal {
  // Reaction tasks are simple; RT here should be relatively low.
  // For mouse/touch + pre-delay, a “typical” median often lands ~700–1200ms.
  const { med, lapses, sd } = reaction;

  let score: 0 | 1 | 2 | 3 = 2;

  if (lapses >= 2 || med > 1600) score = 0;
  else if (lapses === 1 || med > 1200) score = 1;
  else if (med < 800 && sd < 650) score = 3;
  else score = 2;

  const level = levelFromScore(score);
  const emoji = emojiFromScore(score);

  const consistency = sd > 900 ? "inconsistent" : "fairly consistent";

  let oneLiner = "";
  if (score === 3) oneLiner = "You’re responding quickly and consistently.";
  else if (score === 2) oneLiner = "You seem alert enough to keep going.";
  else if (score === 1) oneLiner = "You look slightly tired—responses are slower or you had a lapse.";
  else oneLiner = "Alertness looks low—this is a sign to take a real reset.";

  return {
    title: "Alertness",
    level,
    emoji,
    oneLiner,
    score0to3: score,
    details: [
      `Reaction speed: ${med ? `${Math.round(med)} ms median` : "n/a"}`,
      `Consistency: ${consistency}`,
      `Lapses: ${lapses}`,
    ],
  };
}

function interpretMentalSpeed(speed: PhaseSummary): InterpretedSignal {
  const { accuracy, med, lapses, slowdownPct } = speed;

  let score: 0 | 1 | 2 | 3 = 2;

  if (accuracy < 0.75 || lapses >= 2) score = 0;
  else if (accuracy < 0.85 || slowdownPct > 0.20 || lapses === 1) score = 1;
  else if (accuracy >= 0.95 && med > 0 && med < 1400 && slowdownPct <= 0.12) score = 3;
  else score = 2;

  const level = levelFromScore(score);
  const emoji = emojiFromScore(score);

  const trend = trendLabel(slowdownPct);

  let oneLiner = "";
  if (score === 3) oneLiner = "Fast and accurate—good condition for learning new material.";
  else if (score === 2) oneLiner = "Solid mental speed—learning should still be productive.";
  else if (score === 1) oneLiner = "Efficiency is dropping—review/practice is better than new concepts.";
  else oneLiner = "Mental speed looks foggy—studying now will have low payoff.";

  return {
    title: "Mental speed",
    level,
    emoji,
    oneLiner,
    score0to3: score,
    details: [
      `Accuracy: ${Math.round(accuracy * 100)}%`,
      `Speed: ${med ? `${Math.round(med)} ms median` : "n/a"}`,
      `Trend: ${trend}`,
      `Lapses: ${lapses}`,
    ],
  };
}

function interpretSelfControl(control: PhaseSummary): InterpretedSignal {
  // With button-based Go/No-Go we don’t have pure false-alarm/miss separation,
  // so we interpret “control” mainly via accuracy + lapses + consistency.
  const { accuracy, lapses, sd, med } = control;

  let score: 0 | 1 | 2 | 3 = 2;

  if (accuracy < 0.75 || lapses >= 2) score = 0;
  else if (accuracy < 0.9 || lapses === 1) score = 1;
  else if (accuracy >= 0.98 && sd < 750) score = 3;
  else score = 2;

  const level = levelFromScore(score);
  const emoji = emojiFromScore(score);

  const consistency = sd > 900 ? "a bit erratic" : "steady";

  let oneLiner = "";
  if (score === 3) oneLiner = "Great control—few careless or impulse mistakes.";
  else if (score === 2) oneLiner = "Control looks stable—good for focused work.";
  else if (score === 1) oneLiner = "Some careless errors—slow down or take a short break.";
  else oneLiner = "Control looks low—likely distracted or restless right now.";

  return {
    title: "Self-control",
    level,
    emoji,
    oneLiner,
    score0to3: score,
    details: [
      `Accuracy: ${Math.round(accuracy * 100)}%`,
      `Consistency: ${consistency}`,
      `Median: ${med ? `${Math.round(med)} ms` : "n/a"}`,
      `Lapses: ${lapses}`,
    ],
  };
}

function confidenceFromTotal(total: number): Confidence {
  if (total >= 24) return "High";
  if (total >= 14) return "Medium";
  return "Low";
}

function buildProfile(alert: InterpretedSignal, speed: InterpretedSignal, control: InterpretedSignal): Profile {
  const avg = (alert.score0to3 + speed.score0to3 + control.score0to3) / 3;

  // Red flags
  const anyLow = alert.score0to3 === 0 || speed.score0to3 === 0 || control.score0to3 === 0;
  const twoOrMoreOkayOrWorse = [alert, speed, control].filter((s) => s.score0to3 <= 1).length >= 2;

  if (!anyLow && avg >= 2.6) {
    return {
      emoji: "✅",
      headline: "Excellent to study",
      explanation: "You look sharp and steady—this is a good window for hard work.",
      doNow: ["Learn new material", "Do the hardest problem set", "Deep focus 25–40 min"],
      avoid: ["Long scrolling breaks", "Multitasking"],
    };
  }

  if (!anyLow && avg >= 2.0) {
    return {
      emoji: "🙂",
      headline: "Good to study",
      explanation: "You’re in a workable state—keep going, but schedule a short break soon.",
      doNow: ["Practice problems", "Review notes", "Break in ~20–30 min"],
      avoid: ["Starting a huge new chapter if you feel tired"],
    };
  }

  if (twoOrMoreOkayOrWorse && !anyLow) {
    return {
      emoji: "🟡",
      headline: "Borderline",
      explanation: "You can study, but efficiency is dropping—stick to lighter tasks.",
      doNow: ["Review / flashcards", "Light practice", "Short break now or very soon"],
      avoid: ["Brand new concepts", "Timed mock exams"],
    };
  }

  return {
    emoji: "🟠",
    headline: "Break recommended",
    explanation: "Your signals suggest fatigue or inconsistency—reset before you push more.",
    doNow: ["5–10 min walk", "Water + stretch", "Retry the mini check after the break"],
    avoid: ["Forcing hard studying right now"],
  };
}

export function computeResults(allLogs: AnswerLog[]) {
  const byPhase: Record<Phase, AnswerLog[]> = {
    reaction: allLogs.filter((l) => l.phase === "reaction"),
    speed: allLogs.filter((l) => l.phase === "speed"),
    control: allLogs.filter((l) => l.phase === "control"),
  };

  const phase = {
    reaction: phaseSummary(byPhase.reaction),
    speed: phaseSummary(byPhase.speed),
    control: phaseSummary(byPhase.control),
  };

  // overall basics
  const total = allLogs.length || 1;
  const correctTotal = allLogs.filter((l) => l.correct && !l.timedOut).length;
  const accuracy = correctTotal / total;

  const overallRTs = allLogs.filter((l) => !l.timedOut).map((l) => l.timeMs);
  const med = median(overallRTs);
  const sd = stddev(overallRTs);
  const lapses = allLogs.filter((l) => l.timedOut || l.timeMs > 2500).length;

  // interpreted signals
  const alertness = interpretAlertness(phase.reaction);
  const mentalSpeed = interpretMentalSpeed(phase.speed);
  const selfControl = interpretSelfControl(phase.control);

  // “readiness score” 0..100 mapped from 0..3 signal scores
  const readiness01 = clamp01((alertness.score0to3 + mentalSpeed.score0to3 + selfControl.score0to3) / 9);
  const readinessScore = Math.round(readiness01 * 100);

  const confidence = confidenceFromTotal(total);

  const profile = buildProfile(alertness, mentalSpeed, selfControl);

  // short “why” bullets (trust builder)
  const why: string[] = [];
  why.push(`Accuracy: ${Math.round(accuracy * 100)}%`);
  why.push(`Lapses: ${lapses}`);
  why.push(`Overall speed: ${med ? `${Math.round(med)} ms median` : "n/a"}`);

  return {
    total,
    correctTotal,
    accuracy,
    med,
    sd,
    lapses,
    byPhase,
    phase,

    readinessScore,
    confidence,

    signals: {
      alertness,
      mentalSpeed,
      selfControl,
    },

    profile,
    why,
  };
}

export function getRecommendation(result: ReturnType<typeof computeResults>) {
  // Keep this as a simple string for any existing callers
  return `${result.profile.emoji} ${result.profile.headline}. ${result.profile.explanation}`;
}
