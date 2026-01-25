import type { Phase } from "./questions";

export type AnswerLog = {
  qid: string;
  phase: Phase;
  correct: boolean;
  timeMs: number;
  timedOut: boolean;
};

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

/**
 * Convert a median RT into a 0..1 “speed” score
 * tuned for quick decision tasks.
 */
function speedScoreFromMedian(medMs: number) {
  const fast = 450;  // very sharp
  const slow = 2200; // very sluggish
  const clamped = Math.max(fast, Math.min(slow, medMs));
  return 1 - (clamped - fast) / (slow - fast);
}

function phaseSummary(logs: AnswerLog[]) {
  const total = logs.length || 1;
  const correctCount = logs.filter((l) => l.correct && !l.timedOut).length;
  const accuracy = correctCount / total;

  const rts = logs
    .filter((l) => !l.timedOut)
    .map((l) => l.timeMs);

  const med = median(rts);
  const sd = stddev(rts);

  const lapses = logs.filter((l) => l.timedOut || l.timeMs > 2500).length;

  // slowdown using thirds
  const rtsOrdered = logs
    .filter((l) => !l.timedOut)
    .map((l) => l.timeMs);

  const n = rtsOrdered.length;
  const third = Math.max(1, Math.floor(n / 3));
  const first = rtsOrdered.slice(0, third);
  const last = rtsOrdered.slice(Math.max(0, n - third));

  const firstMed = median(first);
  const lastMed = median(last);
  const slowdownPct = firstMed > 0 ? (lastMed - firstMed) / firstMed : 0;

  return { accuracy, med, sd, lapses, slowdownPct };
}

export function computeResults(allLogs: AnswerLog[]) {
  const phases: Phase[] = ["reaction", "speed", "control"];

  const byPhase: Record<Phase, AnswerLog[]> = {
    reaction: allLogs.filter((l) => l.phase === "reaction"),
    speed: allLogs.filter((l) => l.phase === "speed"),
    control: allLogs.filter((l) => l.phase === "control"),
  };

  const sum = {
    reaction: phaseSummary(byPhase.reaction),
    speed: phaseSummary(byPhase.speed),
    control: phaseSummary(byPhase.control),
  };

  // Overall:
  const total = allLogs.length || 1;
  const correctTotal = allLogs.filter((l) => l.correct && !l.timedOut).length;
  const accuracy = correctTotal / total;

  const overallRTs = allLogs.filter((l) => !l.timedOut).map((l) => l.timeMs);
  const med = median(overallRTs);
  const sd = stddev(overallRTs);
  const lapses = allLogs.filter((l) => l.timedOut || l.timeMs > 2500).length;

  // Phase scores (0..100)
  const reactionScore = Math.round(
    100 *
      clamp01(
        0.55 * sum.reaction.accuracy +
          0.30 * speedScoreFromMedian(sum.reaction.med) +
          0.15 * (1 - clamp01(sum.reaction.lapses / Math.max(1, byPhase.reaction.length)))
      )
  );

  const speedScore = Math.round(
    100 *
      clamp01(
        0.55 * sum.speed.accuracy +
          0.35 * speedScoreFromMedian(sum.speed.med) +
          0.10 * (1 - clamp01(sum.speed.lapses / Math.max(1, byPhase.speed.length)))
      )
  );

  const controlScore = Math.round(
    100 *
      clamp01(
        0.70 * sum.control.accuracy +
          0.20 * speedScoreFromMedian(sum.control.med) +
          0.10 * (1 - clamp01(sum.control.lapses / Math.max(1, byPhase.control.length)))
      )
  );

  const overallScore = Math.round(
    0.34 * reactionScore + 0.40 * speedScore + 0.26 * controlScore
  );

  return {
    total,
    correctTotal,
    accuracy,
    med,
    sd,
    lapses,
    byPhase,
    phase: sum,
    scores: { reactionScore, speedScore, controlScore, overallScore },
  };
}

export function getRecommendation(result: ReturnType<typeof computeResults>) {
  const { scores, phase } = result;

  // Key red flags:
  const bigSlowdown =
    phase.reaction.slowdownPct > 0.25 || phase.speed.slowdownPct > 0.25;
  const manyLapses = result.lapses >= Math.max(2, Math.floor(result.total * 0.15));
  const lowAccuracy = result.accuracy < 0.70;

  if (scores.overallScore >= 80 && !bigSlowdown && !manyLapses) {
    return "✅ You’re sharp. Keep studying (push your hardest topic now).";
  }

  if (scores.overallScore >= 65 && !manyLapses) {
    if (bigSlowdown) return "🙂 You’re slowing down. Take a 5-minute break, then continue.";
    return "🙂 Solid focus. Keep going, but take a short break soon.";
  }

  if (scores.overallScore >= 50 && !manyLapses) {
    return "😵 Focus is slipping. Take a 10-minute reset (walk/water/eyes off screen).";
  }

  // Low score or lots of lapses
  if (manyLapses || lowAccuracy) {
    return "🛑 Not the right mind right now. Stop for 20–30 minutes or take a quick nap, then retry.";
  }

  return "🛑 Focus is low. Reset (food/water/movement), then come back.";
}
