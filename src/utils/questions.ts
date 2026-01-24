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

export function makeQuestionSet(total = 15): Question[] {
  const qs: Question[] = [];

  // 10 quick math
  for (let i = 0; i < 10; i++) {
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

  // 5 “same as previous?”
  const symbols = ["▲", "●", "■", "◆", "★"];
  let prev = symbols[randInt(0, symbols.length - 1)];

  for (let i = 0; i < 5; i++) {
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

  return qs.sort(() => Math.random() - 0.5).slice(0, total);
}
