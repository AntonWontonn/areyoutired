export type Phase = "reaction" | "speed" | "control";

export type QType = "rt_compare" | "dsst" | "gonogo";

export type Question = {
  id: string;
  phase: Phase;
  type: QType;
  prompt: string;
  choices: string[];
  correctIndex: number;

  // Small random pre-delay before the question becomes answerable (reaction phase)
  preDelay?: boolean;

  // If true, allow keyboard controls (reaction phase)
  keyboard?: boolean;

  // Per-question time limit in seconds
  timeLimitSec: number;
};

export type TestPreset = "mini" | "2min";

export type TestPack = {
  questions: Question[];
  meta: {
    preset: TestPreset;
    dsstKey: Record<string, string>;
  };
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

/**
 * DSST-lite key: A/B/C/D -> 1/3/7/9 in random mapping
 */
function makeDSSTKey(): Record<string, string> {
  const letters = ["A", "B", "C", "D"];
  const digits = shuffle(["1", "3", "7", "9"]);
  const key: Record<string, string> = {};
  for (let i = 0; i < letters.length; i++) key[letters[i]] = digits[i];
  return key;
}

function formatDSSTKey(key: Record<string, string>) {
  return Object.entries(key)
    .map(([k, v]) => `${k}→${v}`)
    .join("   ");
}

function makeDSST(
  i: number,
  key: Record<string, string>,
  timeLimitSec: number,
): Question {
  const letters = Object.keys(key);
  const L = letters[randInt(0, letters.length - 1)];
  const correct = key[L];

  // Choices are exactly the 4 digits; shuffled.
  const choices = shuffle(["1", "3", "7", "9"]);
  const correctIndex = choices.indexOf(correct);

  return {
    id: `dsst-${i}`,
    phase: "speed",
    type: "dsst",
    prompt: `Match the letter using the key:\n\n${formatDSSTKey(key)}\n\nLetter: ${L}`,
    choices,
    correctIndex,
    timeLimitSec,
  };
}

function makeRTCompare(i: number, timeLimitSec: number): Question {
  const a = randInt(10, 99);
  let b = randInt(10, 99);
  while (b === a) b = randInt(10, 99);

  const correct = a > b ? "Left" : "Right";
  const choices = ["Left", "Right"];
  const correctIndex = choices.indexOf(correct);

  return {
    id: `rt-cmp-${i}`,
    phase: "reaction",
    type: "rt_compare",
    prompt: `Which number is larger?\n\n${a}     ${b}`,
    choices,
    correctIndex,
    preDelay: true,
    keyboard: true,
    timeLimitSec,
  };
}

function makeGoNoGo(i: number, timeLimitSec: number): Question {
  // Rule: choose GO for everything except X.
  const symbols = ["X", "O", "△", "□", "●"];
  const sym = symbols[randInt(0, symbols.length - 1)];
  const isNoGo = sym === "X";

  const choices = ["GO", "NO-GO"];
  const correctIndex = isNoGo ? 1 : 0;

  return {
    id: `gn-${i}`,
    phase: "control",
    type: "gonogo",
    prompt: `Rule: Choose GO for every symbol EXCEPT X.\n\nSymbol: ${sym}`,
    choices,
    correctIndex,
    timeLimitSec,
  };
}

/**
 * Presets:
 * - mini: ~14 questions (fast)
 * - 2min: ~24 questions (more stable metrics)
 *
 * We order phases explicitly: Reaction -> Speed -> Control,
 * then shuffle WITHIN each phase lightly to keep it from feeling robotic.
 */
export function makeQuestionSet(preset: TestPreset): TestPack {
  const dsstKey = makeDSSTKey();

  // Counts tuned for “student use”
  const config =
    preset === "mini"
      ? {
          reactionN: 4,
          speedN: 6,
          controlN: 4,
          // tighter limits for mini
          reactionLimit: 4,
          speedLimit: 6,
          controlLimit: 5,
        }
      : {
          reactionN: 6,
          speedN: 10,
          controlN: 8,
          // slightly more room but still brisk
          reactionLimit: 4,
          speedLimit: 6,
          controlLimit: 5,
        };

  const reaction: Question[] = [];
  for (let i = 0; i < config.reactionN; i++)
    reaction.push(makeRTCompare(i, config.reactionLimit));

  const speed: Question[] = [];
  for (let i = 0; i < config.speedN; i++)
    speed.push(makeDSST(i, dsstKey, config.speedLimit));

  const control: Question[] = [];
  for (let i = 0; i < config.controlN; i++)
    control.push(makeGoNoGo(i, config.controlLimit));

  // Gentle shuffle inside each phase
  const questions = [
    ...shuffle(reaction),
    ...shuffle(speed),
    ...shuffle(control),
  ];

  return { questions, meta: { preset, dsstKey } };
}
