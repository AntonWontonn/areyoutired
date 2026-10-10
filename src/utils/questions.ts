export type Phase = "reaction" | "speed" | "control";

export type QType = "rt_compare" | "dsst" | "gonogo";

export type TestPreset = "mini" | "2min";

export type ReactionQuestion = {
  id: string;
  phase: "reaction";
  type: "rt_compare";

  left: number;
  right: number;

  choices: ["Left", "Right"];
  correctIndex: number;

  preDelay: true;

  // Research-informed app heuristic, not a validated clinical cutoff.
  timeLimitMs: number;
};

export type DSSTQuestion = {
  id: string;
  phase: "speed";
  type: "dsst";

  targetLetter: string;
  choices: string[];
  correctIndex: number;

  // Research-informed app heuristic.
  timeLimitMs: number;
};

export type GoNoGoQuestion = {
  id: string;
  phase: "control";
  type: "gonogo";

  symbol: string;
  trialKind: "go" | "nogo";

  // Adapted from Go/No-Go research timing.
  timeLimitMs: number;
};

export type Question =
  | ReactionQuestion
  | DSSTQuestion
  | GoNoGoQuestion;

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
 * DSST-lite key:
 * A/B/C/D -> 1/3/7/9 in a random mapping.
 *
 * The key stays fixed for the full speed phase.
 */
function makeDSSTKey(): Record<string, string> {
  const letters = ["A", "B", "C", "D"];
  const digits = shuffle(["1", "3", "7", "9"]);

  const key: Record<string, string> = {};

  for (let i = 0; i < letters.length; i++) {
    key[letters[i]] = digits[i];
  }

  return key;
}

function makeRTCompare(i: number): ReactionQuestion {
  const left = randInt(10, 99);

  let right = randInt(10, 99);

  while (right === left) {
    right = randInt(10, 99);
  }

  return {
    id: `rt-${i}`,
    phase: "reaction",
    type: "rt_compare",

    left,
    right,

    choices: ["Left", "Right"],
    correctIndex: left > right ? 0 : 1,

    preDelay: true,

    // The task requires visual comparison + choice,
    // so this is intentionally longer than a simple PVT response window.
    timeLimitMs: 3000,
  };
}

function makeDSST(
  i: number,
  key: Record<string, string>,
): DSSTQuestion {
  const letters = Object.keys(key);

  const targetLetter =
    letters[randInt(0, letters.length - 1)];

  const correct = key[targetLetter];

  /**
   * Keep response locations fixed.
   *
   * We do NOT shuffle these each trial because that would add
   * visual-search time that is unrelated to the symbol-digit mapping.
   */
  const choices = ["1", "3", "7", "9"];

  return {
    id: `dsst-${i}`,
    phase: "speed",
    type: "dsst",

    targetLetter,
    choices,
    correctIndex: choices.indexOf(correct),

    timeLimitMs: 3000,
  };
}

function makeGoNoGo(
  i: number,
  trialKind: "go" | "nogo",
): GoNoGoQuestion {
  const goSymbols = ["O", "△", "□", "●"];

  const symbol =
    trialKind === "nogo"
      ? "X"
      : goSymbols[randInt(0, goSymbols.length - 1)];

  return {
    id: `gn-${i}`,
    phase: "control",
    type: "gonogo",

    symbol,
    trialKind,

    /**
     * The uploaded Go/No-Go study used an 800 ms response window.
     * We use 1000 ms initially to allow for ordinary browser/device input.
     */
    timeLimitMs: 1000,
  };
}

/**
 * Build Go/No-Go trials with a controlled ratio instead of
 * randomly hoping enough No-Go trials appear.
 */
function makeControlTrials(
  goCount: number,
  noGoCount: number,
): GoNoGoQuestion[] {
  const trialKinds: Array<"go" | "nogo"> = [
    ...Array(goCount).fill("go"),
    ...Array(noGoCount).fill("nogo"),
  ];

  return shuffle(trialKinds).map((trialKind, i) =>
    makeGoNoGo(i, trialKind),
  );
}

/**
 * Presets
 *
 * Mini:
 * - 4 reaction
 * - 4 DSST
 * - 6 control (4 Go / 2 No-Go)
 * - total = 14
 *
 * Full:
 * - 6 reaction
 * - 8 DSST
 * - 10 control (7 Go / 3 No-Go)
 * - total = 24
 *
 * Phase order stays:
 * Reaction -> Speed -> Control
 */
export function makeQuestionSet(
  preset: TestPreset,
): TestPack {
  const dsstKey = makeDSSTKey();

  const config =
    preset === "mini"
      ? {
        reactionN: 4,
        speedN: 4,
        goN: 4,
        noGoN: 2,
      }
      : {
        reactionN: 6,
        speedN: 8,
        goN: 7,
        noGoN: 3,
      };

  const reaction: ReactionQuestion[] = [];

  for (let i = 0; i < config.reactionN; i++) {
    reaction.push(makeRTCompare(i));
  }

  const speed: DSSTQuestion[] = [];

  for (let i = 0; i < config.speedN; i++) {
    speed.push(makeDSST(i, dsstKey));
  }

  const control = makeControlTrials(
    config.goN,
    config.noGoN,
  );

  const questions: Question[] = [
    ...shuffle(reaction),
    ...shuffle(speed),
    ...control,
  ];

  return {
    questions,
    meta: {
      preset,
      dsstKey,
    },
  };
}
