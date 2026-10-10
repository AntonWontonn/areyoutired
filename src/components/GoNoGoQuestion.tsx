"use client";

import { useEffect } from "react";
import type { GoNoGoQuestion as GoNoGoQuestionType } from "../utils/questions";

export default function GoNoGoQuestion({
  question,
  disabled,
  feedback,
  onRespond,
}: {
  question: GoNoGoQuestionType;
  disabled: boolean;
  feedback: string | null;
  onRespond: () => void;
}) {
  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;

      if (e.code === "Space") {
        e.preventDefault();
        onRespond();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, onRespond]);

  if (feedback) {
    return <div className="control-feedback">{feedback}</div>;
  }

  return (
    <div className="gonogo-trial">
      <div className="gonogo-symbol">{question.symbol}</div>

      <button className="go-button" disabled={disabled} onClick={onRespond}>
        PRESS
      </button>

      <p className="control-hint">Press Space or click</p>
    </div>
  );
}
