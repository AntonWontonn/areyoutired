import type { Phase, TestPreset } from "../utils/questions";

function phaseLabel(phase: Phase) {
  if (phase === "reaction") return "Reaction";
  if (phase === "speed") return "Speed";
  return "Control";
}

export default function TestHeader({
  preset,
  phase,
  index,
  total,
  waiting,
  onExit,
}: {
  preset: TestPreset;
  phase: Phase;
  index: number;
  total: number;
  waiting: boolean;
  onExit: () => void;
}) {
  return (
    <header className="test-header">
      <button className="back-button" onClick={onExit}>
        ← Back
      </button>

      <h1 className="test-title">Focus Check</h1>

      <p className="test-meta">
        <b>Preset:</b> {preset === "mini" ? "Mini (~1 min)" : "Full (2 min)"} ·{" "}
        <b>Phase:</b> {phaseLabel(phase)}
      </p>

      <p className="test-meta">
        Question {index + 1} / {total}
      </p>

      <p className="test-meta">
        {waiting
          ? "Get ready..."
          : phase === "control"
            ? "Respond quickly — but don't press for X."
            : "Answer as quickly and accurately as you can."}
      </p>
    </header>
  );
}
