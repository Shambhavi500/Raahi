"use client";

import { useCallback, useEffect, useState } from "react";
import type { Role, State } from "./shared";

export type ActResult<T = unknown> = { ok: boolean; data?: T; error?: string };
export type Act = <T = unknown>(type: string, payload?: Record<string, unknown>) => Promise<ActResult<T>>;

// Polls the local server so every screen (and every open tab) stays in sync.
export function useRaahi() {
  const [state, setState] = useState<State | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      setState(await res.json());
    } catch {
      // Server restarting; the next poll catches up.
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const act: Act = useCallback(
    async (type, payload = {}) => {
      try {
        const res = await fetch("/api/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, ...payload }),
        });
        const json = await res.json();
        if (!json.ok) setToast(json.error ?? "Something went wrong");
        await refresh();
        return json;
      } catch {
        setToast("Can't reach the Raahi server. Is it running?");
        return { ok: false, error: "offline" };
      }
    },
    [refresh],
  );

  return { state, act, toast, setToast };
}

// Each role keeps its own login, so passenger, driver and operator can be open side by side.
export function useSession(role: Role) {
  const key = `raahi.session.${role}`;
  const [id, setIdState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      setIdState(v ? Number(v) : null);
    } catch {
      // Storage blocked: stay logged out.
    }
    setReady(true);
  }, [key]);

  const setId = useCallback(
    (v: number | null) => {
      setIdState(v);
      try {
        if (v == null) localStorage.removeItem(key);
        else localStorage.setItem(key, String(v));
      } catch {
        // Ignore: session just won't survive a reload.
      }
    },
    [key],
  );

  return [id, setId, ready] as const;
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
