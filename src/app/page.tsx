"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [preset, setPreset] = useState<"mini" | "2min">("2min");

  function start() {
    router.push(`/test?preset=${preset}`);
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1>Focus Check</h1>
      <p>Quick test to decide: keep studying, break, or reset.</p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Choose test</h2>

        <label style={{ display: "block", marginTop: 8 }}>
          <input
            type="radio"
            checked={preset === "mini"}
            onChange={() => setPreset("mini")}
          />{" "}
          Mini Check (~1 minute)
        </label>

        <label style={{ display: "block", marginTop: 8 }}>
          <input
            type="radio"
            checked={preset === "2min"}
            onChange={() => setPreset("2min")}
          />{" "}
          Full Check (2 minutes)
        </label>

        <button
          onClick={start}
          style={{
            marginTop: 16,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        >
          Start
        </button>
      </div>
    </main>
  );
}
