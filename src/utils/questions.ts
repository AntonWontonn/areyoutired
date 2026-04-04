export type QType = "math" | "same_prev";

export type Question = {
  id: string;
  type: QType;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeQuestionSet(total = 18): Question[] {
  const qs: Question[] = [];

  // 8 quick math questions
  for (let i = 0; i < 8; i++) {
    const a = randInt(2, 19);
    const b = randInt(2, 19);
    const op = Math.random() < 0.5 ? "+" : "-";
    const ans = op === "+" ? a + b : a - b;

    const choices = new Set<number>();
    choices.add(ans);
    while (choices.size < 4) choices.add(ans + randInt(-5, 5));

    const arr = Array.from(choices).sort(() => Math.random() - 0.5);
    const correctIndex = arr.indexOf(ans);

    qs.push({
      id: `math-${i}`,
      type: "math",
      prompt: `What is ${a} ${op} ${b}?`,
      choices: arr.map(String),
      correctIndex,
    });
  }

  // First shape memory sequence (5 questions)
  const symbols = ["▲", "●", "■", "◆", "★"];
  let prev = symbols[randInt(0, symbols.length - 1)];

  qs.push({
    id: `same-0`,
    type: "same_prev",
    prompt: `Symbol: ${prev}\nRemember this symbol.`,
    choices: ["OK", "OK"],
    correctIndex: 0,
  });

  for (let i = 1; i < 5; i++) {
    const cur = Math.random() < 0.5 ? prev : symbols[randInt(0, symbols.length - 1)];
    const isSame = cur === prev;

    qs.push({
      id: `same-${i}`,
      type: "same_prev",
      prompt: `Symbol: ${cur}\nIs this the same as the previous symbol?`,
      choices: ["Yes", "No"],
      correctIndex: isSame ? 0 : 1,
    });

    prev = cur;
  }

  // Second shape memory sequence (5 questions) - NEW SHAPE
  prev = symbols[randInt(0, symbols.length - 1)];

  qs.push({
    id: `same-5`,
    type: "same_prev",
    prompt: `Symbol: ${prev}\nRemember this NEW symbol.`,
    choices: ["OK", "OK"],
    correctIndex: 0,
  });

  for (let i = 6; i < 10; i++) {
    const cur = Math.random() < 0.5 ? prev : symbols[randInt(0, symbols.length - 1)];
    const isSame = cur === prev;

    qs.push({
      id: `same-${i}`,
      type: "same_prev",
      prompt: `Symbol: ${cur}\nIs this the same as the previous symbol?`,
      choices: ["Yes", "No"],
      correctIndex: isSame ? 0 : 1,
    });

    prev = cur;
  }

  // Find and remove the first remember question to keep it at the start
  const rememberIndex = qs.findIndex(q => q.id === 'same-0');
  const rememberQuestion = qs.splice(rememberIndex, 1)[0];

  // Shuffle the remaining questions and take what we need
  const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, total - 1);

  // Put first remember question first, then rest shuffled (second remember will be somewhere in middle)
  return [rememberQuestion, ...shuffled];
}
