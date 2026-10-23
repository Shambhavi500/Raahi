"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Car, UserRound } from "lucide-react";
import ResetDemo from "@/components/ResetDemo";

const APPS = [
  { id: "passenger", label: "Passenger", icon: UserRound, src: "/passenger", phone: true },
  { id: "operator", label: "Operator", icon: Building2, src: "/operator", phone: false },
  { id: "driver", label: "Driver", icon: Car, src: "/driver", phone: true },
] as const;

/** Judge view: the three real apps in frames, each with its own login. */
export default function DemoPage() {
  const [tab, setTab] = useState<(typeof APPS)[number]["id"]>("passenger");
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white">
          <ArrowLeft size={16} /> Raahi
        </Link>
        <p className="hidden text-sm text-white/50 md:block">
          Book as a passenger → accept in the operator console → drive or drop out as the driver
        </p>
        <ResetDemo className="bg-white/10 text-white hover:bg-white/20" />
      </header>

      <nav className="mx-4 mb-3 flex gap-1 rounded-full bg-white/10 p-1 sm:mx-6 xl:hidden">
        {APPS.map((a) => (
          <button
            key={a.id}
            onClick={() => setTab(a.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold ${
              tab === a.id ? "bg-brand text-ink" : "text-white/70"
            }`}
          >
            <a.icon size={15} /> {a.label}
          </button>
        ))}
      </nav>

      <main className="flex flex-1 justify-center gap-5 px-4 pb-4 sm:px-6 xl:grid xl:grid-cols-[400px_minmax(0,1fr)_400px]">
        {APPS.map((a) => (
          <div key={a.id} className={`${tab === a.id ? "flex" : "hidden"} w-full flex-col xl:flex ${a.phone ? "max-w-[420px]" : ""}`}>
            <p className="mb-2 hidden items-center gap-1.5 text-xs font-bold tracking-wider text-white/50 uppercase xl:flex">
              <a.icon size={13} /> {a.label}
            </p>
            <iframe
              src={a.src}
              title={`${a.label} app`}
              className={`h-[calc(100dvh-130px)] min-h-[640px] w-full bg-canvas ${
                a.phone ? "rounded-[36px] border-[10px] border-[#2a2b2e]" : "rounded-3xl border-4 border-[#2a2b2e]"
              }`}
            />
          </div>
        ))}
      </main>
    </div>
  );
}
