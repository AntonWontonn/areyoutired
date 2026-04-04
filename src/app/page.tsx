"use client";

import { useState } from "react";
import FocusTest from "@/components/FocusTest";

export default function Page() {
  const [start, setStart] = useState(false);

  if (start) {
    return <FocusTest />;
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cozy Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1f1f2e 0%, #3d3d52 25%, #1f1f2e 50%, #2d2d42 75%, #1f1f2e 100%)",
        }}
      />

      {/* Warm overlay for cozy feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-transparent to-amber-900/20" />

      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl text-center px-6 animate-fade-in">
        <h1 className="text-white text-5xl md:text-6xl font-extrabold mb-3 drop-shadow-lg">
          Are You Tired?
        </h1>

        <div className="h-1 w-24 bg-gradient-to-r from-orange-400 to-amber-400 mx-auto mb-8 rounded-full" />

        <p className="text-amber-50 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Take a quick focus test to see how sharp your attention and reaction
          speed really are.
        </p>

        <button
          onClick={() => setStart(true)}
          className="
            px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500
            text-white text-lg font-semibold
            shadow-lg
            transition-all duration-300 ease-out
            hover:-translate-y-2 hover:shadow-2xl
            hover:shadow-orange-500/50
            active:translate-y-0
            hover:from-orange-400 hover:to-amber-400
          "
          style={{
            boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 30px rgba(249, 115, 22, 0.8), 0 0 60px rgba(217, 119, 6, 0.6), 0 4px 15px rgba(249, 115, 22, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 4px 15px rgba(249, 115, 22, 0.3)";
          }}
        >
          Take the Test
        </button>
      </div>
    </main>
  );
}
