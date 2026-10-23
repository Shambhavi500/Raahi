"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Car, RotateCcw, Route, UserRound, X } from "lucide-react";
import type { State } from "@/lib/shared";
import type { Act } from "./ui";
import { PassengerPanel } from "./PassengerPanel";
import { OperatorPanel } from "./OperatorPanel";
import { DriverPanel } from "./DriverPanel";

const TABS = [
  { id: "passenger", label: "Passenger", icon: UserRound },
  { id: "operator", label: "Operator", icon: Building2 },
  { id: "driver", label: "Driver", icon: Car },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function RaahiApp() {
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState<Tab>("passenger");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      setState(await res.json());
    } catch {
      // Server restarting; the next poll will catch up.
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [refresh]);

  const act: Act = useCallback(
    async (type, payload = {}) => {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) setError(json.error ?? "Something went wrong");
      await refresh();
      return json.ok;
    },
    [refresh],
  );

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-ink text-brand">
            <Route size={22} />
          </div>
          <div>
            <h1 className="text-2xl leading-none font-extrabold tracking-tight">Raahi</h1>
            <p className="text-sm text-black/50">Your daily commute, handled. Backup drivers included.</p>
          </div>
        </div>
        <button
          onClick={() => act("reset")}
          className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10"
        >
          <RotateCcw size={14} /> Reset demo
        </button>
      </header>

      <ol className="mb-5 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Priya requests a Women-Only plan",
          "Operator accepts and picks Sunita as primary driver",
          "Priya pays (demo). Trips appear for the week",
          "Sunita taps “Can’t make it”. An eligible backup is auto-assigned",
        ].map((s, i) => (
          <li key={s} className="flex items-center gap-2 rounded-2xl bg-ink px-3 py-2 text-white/80">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-ink">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      {/* Mobile: one role at a time. Desktop: all three side by side. */}
      <nav className="mb-4 flex gap-1 rounded-full bg-ink p-1 lg:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold ${
              tab === t.id ? "bg-brand text-ink" : "text-white/70"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </nav>

      {!state ? (
        <p className="py-20 text-center text-black/50">Loading Raahi…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className={tab === "passenger" ? "" : "hidden lg:block"}>
            <PassengerPanel state={state} act={act} />
          </div>
          <div className={tab === "operator" ? "" : "hidden lg:block"}>
            <OperatorPanel state={state} act={act} />
          </div>
          <div className={tab === "driver" ? "" : "hidden lg:block"}>
            <DriverPanel state={state} act={act} />
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-red-600 p-4 text-sm text-white shadow-xl">
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
