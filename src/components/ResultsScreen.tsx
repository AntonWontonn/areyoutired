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

function kssLabel(score: number) {
    if (score <= 3) return "Alert";
    if (score <= 5) return "Neutral";
    if (score <= 7) return "Sleepy";
    return "Very sleepy";
}

function subjectiveObjectiveNote(
    kss: number,
    readiness: number,
) {
    if (kss >= 8 && readiness >= 85) {
        return "You performed strongly on the objective tasks, but you reported substantial sleepiness.";
    }

    if (kss <= 3 && readiness < 50) {
        return "You reported feeling alert, but your objective performance was reduced during this check.";
    }

    if (kss >= 7 && readiness < 70) {
        return "Your reported sleepiness and objective performance both suggest that focus may be reduced right now.";
    }

    if (kss <= 4 && readiness >= 70) {
        return "Your subjective alertness and objective performance were generally consistent.";
    }

    return "Subjective sleepiness and objective performance do not always move together.";
}

export default function ResultsScreen({
    logs,
    preset,
    kss,
    onRetake,
    onExit,
}: {
    logs: AnswerLog[];
    preset: TestPreset;
    kss: number | null;
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
                {kss !== null && (
                    <div>
                        <h2>How you feel</h2>

                        <p>
                            <b>Sleepiness:</b>{" "}
                            {kss} / 9 ({kssLabel(kss)})
                        </p>

                        <p>
                            {subjectiveObjectiveNote(
                                kss,
                                readiness,
                            )}
                        </p>

                        <p>
                            Your sleepiness rating is reported
                            separately and does not change your
                            objective readiness score.
                        </p>
                    </div>
                )}
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
