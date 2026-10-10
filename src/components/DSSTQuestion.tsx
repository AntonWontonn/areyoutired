import type { DSSTQuestion as DSSTQuestionType } from "../utils/questions";

export default function DSSTQuestion({
  question,
  dsstKey,
  disabled,
  onAnswer,
}: {
  question: DSSTQuestionType;
  dsstKey: Record<string, string>;
  disabled: boolean;
  onAnswer: (choiceIndex: number) => void;
}) {
  return (
    <section className="dsst-section">
      <div className="dsst-key">
        <div className="dsst-key-row">
          {Object.keys(dsstKey).map((letter) => (
            <span key={letter}>{letter}</span>
          ))}
        </div>

        <div className="dsst-key-row dsst-key-values">
          {Object.values(dsstKey).map((value, index) => (
            <span key={`${value}-${index}`}>{value}</span>
          ))}
        </div>
      </div>

      <div className="dsst-target">{question.targetLetter}</div>

      <div className="answer-grid">
        {question.choices.map((choice, index) => (
          <button
            className="answer-button"
            key={choice}
            disabled={disabled}
            onClick={() => onAnswer(index)}
          >
            {choice}
          </button>
        ))}
      </div>
    </section>
  );
}
