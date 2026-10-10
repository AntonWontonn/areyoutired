// src/utils/scoring.ts

import type { Phase, QType, TestPreset } from "./questions";

export type AnswerLog = {
  qid: string;
  phase: Phase;
  type: QType;

  correct: boolean;
  timeMs: number;

  timedOut: boolean;
  responseMade: boolean;

  trialKind?: "go" | "nogo";

  commissionError?: boolean;
  omissionError?: boolean;
};

type Confidence = "Limited" | "Moderate";

type Level = "Great" | "Good" | "Okay" | "Low";

type SignalResult = {
  title: string;
  score0to100: number;

  level: Level;
  emoji: "✅" | "🙂" | "🟡" | "🔴";

  oneLiner: string;
  details: string[];
};

type Profile = {
  headline: string;

  emoji: "✅" | "🙂" | "🟡" | "🟠" | "🔴";

  explanation: string;

  doNow: string[];
  avoid: string[];
};

function clamp(x: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, x));
}

function median(xs: number[]) {
  if (xs.length === 0) {
    return 0;
  }

  const sorted = [...xs].sort((a, b) => a - b);

  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mad(xs: number[]) {
  if (xs.length <= 1) {
    return 0;
  }

  const med = median(xs);

  return median(xs.map((x) => Math.abs(x - med)));
}

function roundTo5(x: number) {
  return Math.round(x / 5) * 5;
}

function scoreToLevel(score: number): Level {
  if (score >= 85) {
    return "Great";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 50) {
    return "Okay";
  }

  return "Low";
}

function levelEmoji(level: Level): SignalResult["emoji"] {
  if (level === "Great") {
    return "✅";
  }

  if (level === "Good") {
    return "🙂";
  }

  if (level === "Okay") {
    return "🟡";
  }

  return "🔴";
}

/**
 * Maps an observed value onto a score
 * using piecewise linear interpolation.
 *
 * These timing points are app-specific
 * heuristics, not clinical norms.
 */
function interpolateScore(value: number, points: Array<[number, number]>) {
  if (value <= points[0][0]) {
    return points[0][1];
  }

  for (let i = 1; i < points.length; i++) {
    const [x2, y2] = points[i];
    const [x1, y1] = points[i - 1];

    if (value <= x2) {
      const position = (value - x1) / (x2 - x1);

      return y1 + position * (y2 - y1);
    }
  }

  return points[points.length - 1][1];
}

function accuracyScore(correct: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return (correct / total) * 100;
}

function errorRateScore(errors: number, total: number) {
  if (total === 0) {
    return 100;
  }

  const rate = errors / total;

  return interpolateScore(rate, [
    [0, 100],
    [0.25, 80],
    [0.5, 55],
    [0.75, 25],
    [1, 0],
  ]);
}

/**
 * Relative median absolute deviation.
 *
 * Fewer than 3 valid RTs is not enough
 * evidence to call performance highly
 * consistent, so return a neutral score.
 */
function consistencyScore(rts: number[]) {
  if (rts.length < 3) {
    return 50;
  }

  const med = median(rts);

  if (med <= 0) {
    return 0;
  }

  const relativeMad = mad(rts) / med;

  return interpolateScore(relativeMad, [
    [0.1, 100],
    [0.15, 90],
    [0.25, 70],
    [0.4, 40],
    [0.6, 0],
  ]);
}

/**
 * App-specific heuristic thresholds.
 *
 * This task is not a clinical PVT, so
 * these values should not be described
 * as PVT norms or diagnostic cutoffs.
 */
function reactionSpeedScore(medianMs: number) {
  if (!medianMs) {
    return 0;
  }

  return interpolateScore(medianMs, [
    [700, 100],
    [950, 85],
    [1250, 65],
    [1800, 35],
    [3000, 0],
  ]);
}

/**
 * App-specific timing heuristic for the
 * shortened symbol-number matching task.
 */
function dsstSpeedScore(medianMs: number) {
  if (!medianMs) {
    return 0;
  }

  return interpolateScore(medianMs, [
    [1500, 100],
    [2200, 75],
    [3000, 35],
    [3500, 0],
  ]);
}

/**
 * App-specific Go response timing
 * heuristic.
 */
function goSpeedScore(medianMs: number) {
  if (!medianMs) {
    return 0;
  }

  return interpolateScore(medianMs, [
    [450, 100],
    [650, 90],
    [800, 75],
    [1000, 50],
    [1200, 0],
  ]);
}

function buildAlertness(logs: AnswerLog[], preset: TestPreset): SignalResult {
  const correctLogs = logs.filter(
    (log) => log.correct && log.responseMade && !log.timedOut,
  );

  const correctRTs = correctLogs.map((log) => log.timeMs);

  const correct = logs.filter((log) => log.correct).length;

  const accuracy = accuracyScore(correct, logs.length);

  const med = median(correctRTs);

  const slowCount = logs.filter(
    (log) => log.timedOut || (log.responseMade && log.timeMs > 1800),
  ).length;

  const slowScore = logs.length > 0 ? 100 * (1 - slowCount / logs.length) : 0;

  const speed = reactionSpeedScore(med);

  let score: number;

  if (preset === "mini") {
    score = accuracy * 0.45 + speed * 0.4 + slowScore * 0.15;
  } else {
    const consistency = consistencyScore(correctRTs);

    score =
      accuracy * 0.35 + speed * 0.35 + consistency * 0.15 + slowScore * 0.15;
  }

  /*
   * Accuracy guardrail:
   * very fast guessing should not
   * produce an excellent alertness
   * score.
   */
  if (accuracy < 75) {
    score = Math.min(score, 55);
  } else if (accuracy < 100) {
    score = Math.min(score, 80);
  }

  score = clamp(score);

  const displayScore = roundTo5(score);

  const level = scoreToLevel(displayScore);

  return {
    title: "Alertness",

    score0to100: displayScore,

    level,

    emoji: levelEmoji(level),

    oneLiner:
      level === "Great"
        ? "Responses were quick and accurate."
        : level === "Good"
          ? "Alertness looked generally solid."
          : level === "Okay"
            ? "Responses showed some slowing or misses."
            : "Alertness looked reduced during this check.",

    details: [
      `Accuracy: ${Math.round(accuracy)}%`,

      `Median correct response: ${med ? `${Math.round(med)} ms` : "n/a"}`,

      `Slow / missed responses: ${slowCount}`,
    ],
  };
}

function buildProcessingSpeed(
  logs: AnswerLog[],
  preset: TestPreset,
): SignalResult {
  const correctLogs = logs.filter(
    (log) => log.correct && log.responseMade && !log.timedOut,
  );

  const correctRTs = correctLogs.map((log) => log.timeMs);

  const correct = logs.filter((log) => log.correct).length;

  const accuracy = accuracyScore(correct, logs.length);

  const med = median(correctRTs);

  const speed = dsstSpeedScore(med);

  let score: number;

  if (preset === "mini") {
    score = accuracy * 0.6 + speed * 0.4;

    /*
     * Mini has only 4 processing
     * trials, so accuracy occurs in
     * large 25% jumps.
     *
     * Speed should not fully compensate
     * for wrong matches.
     */
    if (accuracy < 50) {
      score = Math.min(score, 40);
    } else if (accuracy < 75) {
      score = Math.min(score, 55);
    } else if (accuracy < 100) {
      score = Math.min(score, 70);
    }
  } else {
    const consistency = consistencyScore(correctRTs);

    score = accuracy * 0.5 + speed * 0.35 + consistency * 0.15;

    /*
     * Full mode has 8 processing
     * trials. Accuracy remains a
     * guardrail because this task
     * measures speed AND correctness.
     */
    if (accuracy < 75) {
      score = Math.min(score, 45);
    } else if (accuracy < 87.5) {
      score = Math.min(score, 65);
    } else if (accuracy < 100) {
      score = Math.min(score, 80);
    }
  }

  score = clamp(score);

  const displayScore = roundTo5(score);

  const level = scoreToLevel(displayScore);

  return {
    title: "Processing efficiency",

    score0to100: displayScore,

    level,

    emoji: levelEmoji(level),

    oneLiner:
      level === "Great"
        ? "Matching was fast and accurate."
        : level === "Good"
          ? "Processing efficiency looked solid."
          : level === "Okay"
            ? "Matching was somewhat slower or less accurate."
            : "Matching efficiency was reduced during this check.",

    details: [
      `Accuracy: ${Math.round(accuracy)}%`,

      `Median correct response: ${med ? `${Math.round(med)} ms` : "n/a"}`,
    ],
  };
}

function buildResponseControl(
  logs: AnswerLog[],
  preset: TestPreset,
): SignalResult {
  const goLogs = logs.filter((log) => log.trialKind === "go");

  const noGoLogs = logs.filter((log) => log.trialKind === "nogo");

  const commissions = noGoLogs.filter((log) => log.commissionError).length;

  const omissions = goLogs.filter((log) => log.omissionError).length;

  const validGoRTs = goLogs
    .filter((log) => log.responseMade && log.correct && !log.timedOut)
    .map((log) => log.timeMs);

  const goMed = median(validGoRTs);

  const commissionScore = errorRateScore(commissions, noGoLogs.length);

  const omissionScore = errorRateScore(omissions, goLogs.length);

  const speed = goSpeedScore(goMed);

  let score: number;

  if (preset === "mini") {
    score = commissionScore * 0.45 + omissionScore * 0.35 + speed * 0.2;

    /*
     * Mini contains only 2 No-Go
     * trials. One commission therefore
     * means 50% of inhibition
     * opportunities were missed.
     *
     * Do not allow extremely fast Go
     * responses to hide that.
     */
    if (commissions >= 2) {
      score = Math.min(score, 35);
    } else if (commissions === 1) {
      score = Math.min(score, 70);
    }

    /*
     * Two or more missed Go trials
     * means at least half of Mini's
     * Go opportunities were missed.
     */
    if (omissions >= 2) {
      score = Math.min(score, 50);
    }
  } else {
    const consistency = consistencyScore(validGoRTs);

    score =
      commissionScore * 0.5 +
      omissionScore * 0.25 +
      speed * 0.15 +
      consistency * 0.1;
  }

  score = clamp(score);

  const displayScore = roundTo5(score);

  const level = scoreToLevel(displayScore);

  return {
    title: "Response control",

    score0to100: displayScore,

    level,

    emoji: levelEmoji(level),

    oneLiner:
      level === "Great"
        ? "Response inhibition looked strong."
        : level === "Good"
          ? "Response control looked stable."
          : level === "Okay"
            ? "There were some missed or impulsive responses."
            : "Response control was inconsistent during this check.",

    details: [
      `No-Go commission errors: ${commissions}/${noGoLogs.length}`,

      `Go omissions: ${omissions}/${goLogs.length}`,

      `Median Go response: ${goMed ? `${Math.round(goMed)} ms` : "n/a"}`,
    ],
  };
}

function buildProfile(
  alertness: SignalResult,
  processing: SignalResult,
  control: SignalResult,
): Profile {
  const overall =
    (alertness.score0to100 + processing.score0to100 + control.score0to100) / 3;

  const lowest = Math.min(
    alertness.score0to100,
    processing.score0to100,
    control.score0to100,
  );

  if (overall >= 85 && lowest >= 85) {
    return {
      emoji: "✅",

      headline: "Ready for focused work",

      explanation:
        "Your objective performance was strong across all three areas.",

      doNow: [
        "Learn new material",
        "Do difficult problem solving",
        "Use a focused study block",
      ],

      avoid: ["Unnecessary multitasking"],
    };
  }

  if (overall >= 70 && lowest >= 50) {
    return {
      emoji: "🙂",

      headline: "Good to study",

      explanation: "Your performance looks workable for productive studying.",

      doNow: [
        "Practice problems",
        "Review or learn material",
        "Take a short break if focus starts dropping",
      ],

      avoid: ["Long distraction-heavy breaks"],
    };
  }

  if (overall >= 50) {
    return {
      emoji: "🟡",

      headline: "Consider lighter work",

      explanation: "Some performance signals were reduced.",

      doNow: ["Review familiar material", "Flashcards", "Take a short reset"],

      avoid: ["High-stakes timed work"],
    };
  }

  return {
    emoji: "🟠",

    headline: "Break recommended",

    explanation: "Multiple performance signals were reduced during this check.",

    doNow: ["Take a short break", "Move around", "Retry later if useful"],

    avoid: ["Forcing difficult work right now"],
  };
}

export function computeResults(allLogs: AnswerLog[], preset: TestPreset) {
  const reaction = allLogs.filter((log) => log.phase === "reaction");

  const speed = allLogs.filter((log) => log.phase === "speed");

  const control = allLogs.filter((log) => log.phase === "control");

  const alertness = buildAlertness(reaction, preset);

  const mentalSpeed = buildProcessingSpeed(speed, preset);

  const selfControl = buildResponseControl(control, preset);

  const rawReadiness =
    (alertness.score0to100 +
      mentalSpeed.score0to100 +
      selfControl.score0to100) /
    3;

  const lowestDomain = Math.min(
    alertness.score0to100,
    mentalSpeed.score0to100,
    selfControl.score0to100,
  );

  let readinessScore = roundTo5(rawReadiness);

  // Overall readiness should not be "Great"
  // unless every domain is also Great.
  if (lowestDomain < 40) {
    readinessScore = Math.min(readinessScore, 65);
  } else if (lowestDomain < 55) {
    readinessScore = Math.min(readinessScore, 75);
  } else if (lowestDomain < 85) {
    readinessScore = Math.min(readinessScore, 80);
  }

  const total = allLogs.length;

  const correctTotal = allLogs.filter((log) => log.correct).length;

  const accuracy = total > 0 ? correctTotal / total : 0;

  const profile = buildProfile(alertness, mentalSpeed, selfControl);

  const confidence: Confidence = preset === "mini" ? "Limited" : "Moderate";

  return {
    total,
    correctTotal,
    accuracy,

    readinessScore,
    confidence,

    signals: {
      alertness,
      mentalSpeed,
      selfControl,
    },

    profile,

    why: [
      `Overall accuracy: ${Math.round(accuracy * 100)}%`,

      `Mode: ${preset === "mini" ? "Quick estimate" : "Extended check"}`,
    ],

    byPhase: {
      reaction,
      speed,
      control,
    },
  };
}

export function getRecommendation(result: ReturnType<typeof computeResults>) {
  return `${result.profile.emoji} ${result.profile.headline}. ${result.profile.explanation}`;
}
