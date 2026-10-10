"use client";

import { useEffect } from "react";
import type { ReactionQuestion as ReactionQuestionType } from "../utils/questions";

export default function ReactionQuestion({
  question,
  disabled,
  onAnswer,
}: {
  question: ReactionQuestionType;
  disabled: boolean;
  onAnswer: (choiceIndex: number) => void;
}) {
  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onAnswer(0);
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        onAnswer(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, onAnswer]);

  if (disabled) {
    return <div className="reaction-ready">+</div>;
  }

  return (
    <div className="reaction-trial">
      <button onClick={() => onAnswer(0)}>{question.left}</button>

      <button onClick={() => onAnswer(1)}>{question.right}</button>
    </div>
  );
}
