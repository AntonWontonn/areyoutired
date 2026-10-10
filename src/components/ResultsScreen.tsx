import {
    computeResults,
    getRecommendation,
    type AnswerLog,
} from "../utils/scoring";

import type { TestPreset } from "../utils/questions";

function readinessLabel(score: number) {
    if (score >= 85) return "Great";
    if (score >= 70) return "Good";
    if (score >= 50) return "Okay";
    return "Low";
}

export default function ResultsScreen({
    logs,
    preset,
    onRetake,
    onExit,
}: {
    logs: AnswerLog[];
    preset: TestPreset;
    onRetake: () => void;
    onExit: () => void;
}) {
    const result = computeResults(logs, preset);
    const rec = getRecommendation(result);

    const pct = Math.round(result.accuracy * 100);

    const readiness = result.readinessScore;
    const readinessText = readinessLabel(readiness);

    const { alertness, mentalSpeed, selfControl } =
        result.signals;

    const modeLabel =
        preset === "mini"
            ? "Quick estimate"
            : "Extended check";

    return (
        <main
            style={{
                maxWidth: 860,
                margin: "40px auto",
                padding: 16,
                fontFamily: "system-ui",
            }}
        >
            <button onClick={onExit}>
                ← Back
            </button>

            <h1>Focus Result</h1>

            <div>
                <h2>
                    {result.profile.emoji}{" "}
                    {result.profile.headline}
                </h2>

                <p>
                    {result.profile.explanation}
                </p>

                <p>
                    <b>Focus readiness:</b>{" "}
                    {readiness} / 100 (
                    {readinessText})
                </p>

                <p>
                    <b>Mode:</b>{" "}
                    {modeLabel}
                </p>

                <p>
                    <b>Measurement confidence:</b>{" "}
                    {result.confidence}
                </p>

                <p>
                    <b>Overall accuracy:</b>{" "}
                    {result.correctTotal}/
                    {result.total} ({pct}%)
                </p>
            </div>

            <h2>Your focus signals</h2>

            {[
                alertness,
                mentalSpeed,
                selfControl,
            ].map((signal) => (
                <div key={signal.title}>
                    <h3>
                        {signal.emoji}{" "}
                        {signal.title}:{" "}
                        {signal.score0to100} / 100
                    </h3>

                    <p>
                        <b>{signal.level}</b> —{" "}
                        {signal.oneLiner}
                    </p>

                    <ul>
                        {signal.details.map(
                            (detail) => (
                                <li key={detail}>
                                    {detail}
                                </li>
                            ),
                        )}
                    </ul>
                </div>
            ))}

            <h2>What to do now</h2>

            <h3>Recommended</h3>

            <ul>
                {result.profile.doNow.map(
                    (item) => (
                        <li key={item}>
                            {item}
                        </li>
                    ),
                )}
            </ul>

            <h3>Avoid</h3>

            <ul>
                {result.profile.avoid.map(
                    (item) => (
                        <li key={item}>
                            {item}
                        </li>
                    ),
                )}
            </ul>

            <h3>
                Why this recommendation?
            </h3>

            <ul>
                {result.why.map((item) => (
                    <li key={item}>
                        {item}
                    </li>
                ))}
            </ul>

            <p>{rec}</p>

            <button onClick={onRetake}>
                Retake
            </button>

            <button onClick={onExit}>
                Home
            </button>
        </main>
    );
}
