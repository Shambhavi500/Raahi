"use client";

import type { ReactNode } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";
import { DAY_LABELS, type Category, type EventKind, type PlanStatus, type RaahiEvent, type State, type TripStatus } from "@/lib/shared";

export type Act = (type: string, payload?: Record<string, unknown>) => Promise<boolean>;
export interface PanelProps {
  state: State;
  act: Act;
}

type Tone = "green" | "amber" | "red" | "blue" | "slate" | "lime";

const TONES: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-800",
  slate: "bg-black/5 text-black/60",
  lime: "bg-brand text-ink",
};

export function Chip({ tone, children, pulse }: { tone: Tone; children: ReactNode; pulse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]} ${pulse ? "animate-pulse" : ""}`}
    >
      {children}
    </span>
  );
}

const TRIP_STATUS: Record<TripStatus, [string, Tone, boolean?]> = {
  ASSIGNMENT_PENDING: ["Assigning driver", "amber", true],
  CONFIRMED: ["Confirmed", "green"],
  REPLACEMENT_SEARCHING: ["Finding replacement", "amber", true],
  NO_ELIGIBLE_DRIVER: ["No eligible driver", "red"],
  DRIVER_EN_ROUTE: ["Driver on the way", "blue"],
  ARRIVED: ["Driver arrived", "blue"],
  IN_PROGRESS: ["On trip", "lime"],
  COMPLETED: ["Completed", "slate"],
  CANCELLED_REFUNDED: ["Cancelled · refunded", "slate"],
};

const PLAN_STATUS: Record<PlanStatus, [string, Tone]> = {
  PENDING_OPERATOR_CONFIRMATION: ["Awaiting operator", "amber"],
  PENDING_PAYMENT: ["Accepted · pay to activate", "blue"],
  ACTIVE: ["Active", "green"],
  REJECTED: ["Not accepted", "red"],
};

export function TripStatusChip({ status }: { status: TripStatus }) {
  const [label, tone, pulse] = TRIP_STATUS[status];
  return (
    <Chip tone={tone} pulse={pulse}>
      {label}
    </Chip>
  );
}

export function PlanStatusChip({ status }: { status: PlanStatus }) {
  const [label, tone] = PLAN_STATUS[status];
  return <Chip tone={tone}>{label}</Chip>;
}

export function CategoryChip({ category }: { category: Category }) {
  return category === "WOMEN_ONLY" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-800">
      <ShieldCheck size={12} /> Women-Only
    </span>
  ) : (
    <Chip tone="slate">Standard</Chip>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-3xl border border-black/10 bg-white p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-5 mb-2 flex items-center justify-between">
      <h3 className="text-xs font-bold tracking-wider text-black/50 uppercase">{children}</h3>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "dark",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "dark" | "lime" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    dark: "bg-ink text-white hover:bg-black",
    lime: "bg-brand text-ink hover:brightness-95",
    ghost: "bg-black/5 text-ink hover:bg-black/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-black/15 p-4 text-center text-sm text-black/50">{children}</p>;
}

const KIND_STYLE: Record<EventKind, string> = {
  info: "border-l-sky-400",
  success: "border-l-emerald-500",
  warning: "border-l-amber-400",
  danger: "border-l-red-500",
};

export function EventFeed({ events, limit = 6 }: { events: RaahiEvent[]; limit?: number }) {
  if (!events.length) return <Empty>No updates yet.</Empty>;
  return (
    <ul className="space-y-2">
      {events.slice(0, limit).map((e) => (
        <li key={e.id} className={`rounded-xl border-l-4 bg-white px-3 py-2 ${KIND_STYLE[e.kind]}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{e.title}</p>
            <span className="shrink-0 text-[11px] text-black/40">{fmtClock(e.ts)}</span>
          </div>
          {e.detail && <p className="mt-0.5 text-xs text-black/60">{e.detail}</p>}
        </li>
      ))}
    </ul>
  );
}

// Big banner for the newest update, highlighted for a few seconds after it arrives.
export function LatestBanner({ event }: { event?: RaahiEvent }) {
  if (!event) return null;
  const fresh = Date.now() - new Date(event.ts).getTime() < 10_000;
  const bg = {
    info: "bg-sky-50 border-sky-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  }[event.kind];
  return (
    <div className={`rounded-2xl border p-3 transition ${bg} ${fresh ? "ring-2 ring-brand" : "opacity-80"}`}>
      <p className="text-[11px] font-bold tracking-wider text-black/40 uppercase">{fresh ? "Just now" : "Latest update"}</p>
      <p className="text-sm font-semibold">{event.title}</p>
      {event.detail && <p className="mt-0.5 text-xs text-black/60">{event.detail}</p>}
    </div>
  );
}

export function fmtDate(date: string, today: string) {
  if (date === today) return "Today";
  const d = new Date(date + "T00:00");
  const t = new Date(today + "T00:00");
  if ((d.getTime() - t.getTime()) / 86_400_000 === 1) return "Tomorrow";
  return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })}`;
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function fmtClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export function stars(sum: number, count: number) {
  return count ? (sum / count).toFixed(1) : "New";
}

export function forAudience(state: State, key: string) {
  return state.events.filter((e) => e.audience.includes(`,${key},`));
}

export function PanelShell({
  title,
  icon: Icon,
  picker,
  children,
}: {
  title: string;
  icon: LucideIcon;
  picker?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[28px] border border-black/10 bg-canvas shadow-sm sm:rounded-[32px]">
      <div className="stripes flex items-center justify-between gap-3 bg-ink px-4 py-3.5 text-white sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand text-ink">
            <Icon size={17} />
          </span>
          <h2 className="truncate font-bold">{title}</h2>
        </div>
        <div className="min-w-0 shrink-0">{picker}</div>
      </div>
      <div className="p-3.5 sm:p-5 xl:p-4">{children}</div>
    </section>
  );
}

export function Picker<T extends number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; name: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as T)}
      className="max-w-[10.5rem] rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white outline-none [&>option]:text-ink"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
