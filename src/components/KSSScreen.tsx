"use client";

import { useState } from "react";

const KSS_OPTIONS = [
  { value: 1, label: "Extremely alert" },
  { value: 2, label: "Very alert" },
  { value: 3, label: "Alert" },
  { value: 4, label: "Rather alert" },
  { value: 5, label: "Neither alert nor sleepy" },
  { value: 6, label: "Some signs of sleepiness" },
  {
    value: 7,
    label: "Sleepy, but no effort to keep awake",
  },
  {
    value: 8,
    label: "Sleepy, some effort to keep awake",
  },
  {
    value: 9,
    label: "Very sleepy, great effort to keep awake",
  },
];

export default function KSSScreen({
  onContinue,
  onSkip,
  onBack,
}: {
  onContinue: (value: number) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="test-page">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      <div className="kss-screen">
        <h1>How sleepy do you feel?</h1>

        <p>
          Think about how alert or sleepy you have felt during the last few
          minutes.
        </p>

        <p>Choose the number that best matches how you feel right now.</p>

        <div className="kss-options">
          {KSS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                selected === option.value ? "kss-option selected" : "kss-option"
              }
              onClick={() => setSelected(option.value)}
            >
              <span className="kss-number">{option.value}</span>

              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="kss-actions">
          <button
            type="button"
            disabled={selected === null}
            onClick={() => {
              if (selected !== null) {
                onContinue(selected);
              }
            }}
          >
            Continue
          </button>

          <button type="button" onClick={onSkip}>
            Skip for now
          </button>
        </div>

        <p className="kss-note">
          This self-report is shown separately from your objective performance
          score.
        </p>
      </div>
    </main>
  );
}
