"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

/** Wipes the local database back to the starting demo data and logs every app out. */
export default function ResetDemo({ className = "" }: { className?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const reset = async () => {
    if (!window.confirm("Reset all demo data? Everyone will be logged out.")) return;
    setState("busy");
    await fetch("/api/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "reset" }),
    });
    try {
      for (const role of ["passenger", "driver", "operator"]) localStorage.removeItem(`raahi.session.${role}`);
    } catch {
      // Storage blocked: nothing to clear.
    }
    setState("done");
    setTimeout(() => window.location.reload(), 400);
  };
  return (
    <button
      onClick={reset}
      disabled={state === "busy"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${className}`}
    >
      <RotateCcw size={14} /> {state === "done" ? "Reset!" : state === "busy" ? "Resetting…" : "Reset demo"}
    </button>
  );
}
