"use client";

import { useEffect, useState } from "react";
import type { Phase } from "../utils/questions";

export default function PracticeScreen({
    phase,
    dsstKey,
    onDone,
    onBack,
}: {
    phase: Phase;
    dsstKey: Record<string, string>;
    onDone: () => void;
    onBack: () => void;
}) {
    const [message, setMessage] = useState<string | null>(null);

    // Go/No-Go practice:
    // 0 = GO example
    // 1 = NO-GO example
    // 2 = complete
    const [controlStep, setControlStep] = useState(0);

    function handleReaction(choice: "left" | "right") {
        // Practice example: 42 vs 67
        if (choice === "right") {
            setMessage("Correct — choose the larger number.");
        } else {
            setMessage("Try again — choose the larger number.");
        }
    }

    function handleDSST(choice: string) {
        const correct = dsstKey["A"];

        if (choice === correct) {
            setMessage("Correct — use the key to match the letter.");
        } else {
            setMessage("Try again — check the key above.");
        }
    }

    function handleGoResponse() {
        if (controlStep === 0) {
            setMessage("Correct — press for normal symbols.");

            window.setTimeout(() => {
                setMessage(null);
                setControlStep(1);
            }, 700);

            return;
        }

        if (controlStep === 1) {
            setMessage("That's X — don't press.");

            // Restart the X example.
            setControlStep(0);

            window.setTimeout(() => {
                setMessage(null);
                setControlStep(1);
            }, 900);
        }
    }

    useEffect(() => {
        if (phase !== "reaction") return;

        function handleReactionKey(e: KeyboardEvent) {
            if (e.repeat) return;

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                handleReaction("left");
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                handleReaction("right");
            }
        }

        window.addEventListener("keydown", handleReactionKey);

        return () => {
            window.removeEventListener("keydown", handleReactionKey);
        };
    }, [phase]);

    useEffect(() => {
        if (phase !== "control" || controlStep !== 1) return;

        const timer = window.setTimeout(() => {
            setMessage("Nice hold — that's exactly right.");
            setControlStep(2);
        }, 1200);

        return () => window.clearTimeout(timer);
    }, [phase, controlStep]);

    useEffect(() => {
        if (phase !== "control") return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.code !== "Space" || e.repeat) return;

            e.preventDefault();
            handleGoResponse();
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });

    return (
        <main className="test-page">
            <button className="back-button" onClick={onBack}>
                ← Back
            </button>

            <div className="practice-card">
                <p className="practice-label">Practice</p>

                {phase === "reaction" && (
                    <>
                        <h2>Choose the larger number</h2>

                        <p>
                            Practice is untimed. Click the larger number or use the ← and → arrow keys.
                        </p>

                        <p className="practice-note">
                            In the real test, each item will only stay active for about 3 seconds.
                        </p>

                        <div className="reaction-trial">
                            <button onClick={() => handleReaction("left")}>
                                42
                            </button>

                            <button onClick={() => handleReaction("right")}>
                                67
                            </button>
                        </div>

                        {message && (
                            <p className="practice-feedback">{message}</p>
                        )}

                        {message?.startsWith("Correct") && (
                            <button
                                className="practice-start-button"
                                onClick={onDone}
                            >
                                Start Reaction
                            </button>
                        )}
                    </>
                )}

                {phase === "speed" && (
                    <>
                        <h2>Match the letter</h2>

                        <div className="dsst-key">
                            <div className="dsst-key-row">
                                {Object.keys(dsstKey).map((letter) => (
                                    <span key={letter}>{letter}</span>
                                ))}
                            </div>

                            <div className="dsst-key-row dsst-key-values">
                                {Object.values(dsstKey).map((value, i) => (
                                    <span key={`${value}-${i}`}>{value}</span>
                                ))}
                            </div>
                        </div>

                        <div className="dsst-target">A</div>

                        <div className="answer-grid">
                            {["1", "3", "7", "9"].map((choice) => (
                                <button
                                    className="answer-button"
                                    key={choice}
                                    onClick={() => handleDSST(choice)}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>

                        {message && (
                            <p className="practice-feedback">{message}</p>
                        )}

                        {message?.startsWith("Correct") && (
                            <button
                                className="practice-start-button"
                                onClick={onDone}
                            >
                                Start Matching
                            </button>
                        )}
                    </>
                )}

                {phase === "control" && (
                    <>
                        <h2>Press for everything except X</h2>

                        {controlStep === 0 && (
                            <>
                                <p>Press Space or click the button for this symbol:</p>

                                <div className="gonogo-symbol">O</div>

                                <button
                                    className="go-button"
                                    onClick={handleGoResponse}
                                >
                                    PRESS
                                </button>
                            </>
                        )}

                        {controlStep === 1 && (
                            <>
                                <p>
                                    Now do <strong>nothing</strong>.
                                </p>

                                <div className="gonogo-symbol">X</div>
                            </>
                        )}

                        {message && (
                            <p className="practice-feedback">{message}</p>
                        )}

                        {controlStep === 2 && (
                            <button
                                className="practice-start-button"
                                onClick={onDone}
                            >
                                Start Control
                            </button>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
