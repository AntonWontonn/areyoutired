"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FocusTest from "../../components/FocusTest";
import type { TestPreset } from "../../utils/questions";

export default function TestPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const preset = (sp.get("preset") as TestPreset) ?? "2min";

  return <FocusTest preset={preset} onExit={() => router.push("/")} />;
}
