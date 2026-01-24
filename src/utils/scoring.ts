export type AnswerLog = {
    qid: string;
    correct: boolean;
    timeMs: number;
  };
  
  export function speedScoreFromAvg(avgMs: number) {
    const min = 600;
    const max = 6000;
    const clamped = Math.max(min, Math.min(max, avgMs));
    return 1 - (clamped - min) / (max - min);
  }
  
  export function getRecommendation(score: number) {
    if (score >= 0.8) return "✅ Focus is strong. Keep studying.";
    if (score >= 0.6) return "🙂 Decent focus. Take a 5-minute break, then continue.";
    if (score >= 0.4) return "😵 Focus is slipping. Try a 10-minute nap or a short walk.";
    return "🛑 Focus is low. Stop studying for 20–30 minutes and reset (food/water/movement).";
  }
  
  export function computeResults(logs: AnswerLog[], total: number) {
    const correctCount = logs.filter((l) => l.correct).length;
    const accuracy = total === 0 ? 0 : correctCount / total;
    const avgMs = total === 0 ? 0 : Math.round(logs.reduce((s, l) => s + l.timeMs, 0) / total);
  
    const speedScore = speedScoreFromAvg(avgMs);
    const score = 0.7 * accuracy + 0.3 * speedScore;
  
    return { correctCount, accuracy, avgMs, speedScore, score };
  }
  