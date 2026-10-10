import type { Phase } from "../utils/questions";

export default function PhaseIntro({
    phase,
    onStart,
    onPractice,
}: {
    phase: Phase;
    onStart: () => void;
    onPractice: () => void;
}) {
    if (phase === "reaction") {
        return (
            <div className="phase-intro">
                <h2>Reaction</h2>

                <p>
                    Choose the larger number as quickly and accurately as possible.
                </p>

                <p>
                    Press <b>←</b> for the left number or <b>→</b> for the right number.
                </p>

                <p>The numbers will appear after a short random delay.</p>

                <div className="phase-actions">
                    <button
                        className="secondary-action"
                        onClick={onPractice}
                    >
                        Try practice
                    </button>

                    <button onClick={onStart}>
                        Start Reaction
                    </button>
                </div>
            </div>
        );
    }

    if (phase === "speed") {
        return (
            <div className="phase-intro">
                <h2>Processing Speed</h2>

                <p>
                    Use the key to match each letter with its number as quickly and
                    accurately as possible.
                </p>

                <p>The key stays the same throughout this section.</p>

                <div className="phase-actions">
                    <button
                        className="secondary-action"
                        onClick={onPractice}
                    >
                        Try practice
                    </button>

                    <button onClick={onStart}>
                        Start Matching
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="phase-intro">
            <h2>Response Control</h2>

            <p>
                Press Space when you see any symbol except <b>X</b>.
            </p>

            <p>
                When you see <b>X</b>, do nothing.
            </p>

            <div className="phase-actions">
                <button
                    className="secondary-action"
                    onClick={onPractice}
                >
                    Try practice
                </button>

                <button onClick={onStart}>
                    Start Control
                </button>
            </div>
        </div>
    );
}
