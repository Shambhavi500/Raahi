"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Route, ShieldCheck, X, type LucideIcon } from "lucide-react";
import {
  DAY_LABELS,
  type Category,
  type EventKind,
  type PlanStatus,
  type RaahiEvent,
  type State,
  type TripStatus,
} from "@/lib/shared";

// ---------- small pieces ----------

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

export const TRIP_STATUS: Record<TripStatus, [string, Tone, boolean?]> = {
  ASSIGNMENT_PENDING: ["Assigning driver", "amber", true],
  CONFIRMED: ["Driver confirmed", "green"],
  REPLACEMENT_SEARCHING: ["Finding backup", "amber", true],
  NO_ELIGIBLE_DRIVER: ["Needs your choice", "red"],
  DRIVER_EN_ROUTE: ["On the way", "blue"],
  ARRIVED: ["Driver arrived", "blue"],
  IN_PROGRESS: ["On ride", "lime"],
  COMPLETED: ["Completed", "slate"],
  CANCELLED_REFUNDED: ["Cancelled · refunded", "slate"],
};

const PLAN_STATUS: Record<PlanStatus, [string, Tone]> = {
  PENDING_OPERATOR_CONFIRMATION: ["Awaiting confirmation", "amber"],
  PENDING_PAYMENT: ["Confirmed · pay to start", "blue"],
  ACTIVE: ["Active", "green"],
  REJECTED: ["Not available", "red"],
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
    <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-fuchsia-800">
      <ShieldCheck size={12} /> Women-Only
    </span>
  ) : (
    <Chip tone="slate">Standard</Chip>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base = `block w-full min-w-0 rounded-3xl border border-black/10 bg-white p-4 text-left ${className}`;
  return onClick ? (
    <button onClick={onClick} className={`${base} transition hover:border-black/25 active:scale-[0.99]`}>
      {children}
    </button>
  ) : (
    <div className={base}>{children}</div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between gap-2">
      <h3 className="text-xs font-bold tracking-wider text-black/50 uppercase">{children}</h3>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "dark",
  size = "md",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "dark" | "lime" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    dark: "bg-ink text-white hover:bg-black",
    lime: "bg-brand text-ink hover:brightness-95",
    ghost: "bg-black/5 text-ink hover:bg-black/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-black/15 bg-white text-ink hover:border-black/30",
  }[variant];
  const sizes = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-14 w-full px-5 text-base",
  }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${sizes} ${className}`}
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

// Shows the newest update only while it's fresh, like a push notification.
export function FreshBanner({ event, withinMs = 20_000 }: { event?: RaahiEvent; withinMs?: number }) {
  if (!event || Date.now() - new Date(event.ts).getTime() > withinMs) return null;
  const bg = {
    info: "bg-sky-50 border-sky-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  }[event.kind];
  return (
    <div className={`animate-rise mb-3 rounded-2xl border p-3 ring-2 ring-brand ${bg}`}>
      <p className="text-[11px] font-bold tracking-wider text-black/40 uppercase">Just now</p>
      <p className="text-sm font-semibold">{event.title}</p>
      {event.detail && <p className="mt-0.5 text-xs text-black/60">{event.detail}</p>}
    </div>
  );
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand ${className}`}>
      {initials}
    </span>
  );
}

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="animate-rise fixed inset-x-4 top-4 z-[2000] mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-ink p-4 text-sm text-white shadow-2xl">
      <p className="flex-1">{message}</p>
      <button onClick={onClose} aria-label="Dismiss" className="text-white/60 hover:text-white">
        <X size={18} />
      </button>
    </div>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid size-9 place-items-center rounded-xl ${dark ? "bg-brand text-ink" : "bg-ink text-brand"}`}>
        <Route size={19} />
      </span>
      <span className="text-xl font-extrabold tracking-tight">Raahi</span>
    </span>
  );
}

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink text-white">
      <div className="animate-pop">
        <Logo dark />
      </div>
    </div>
  );
}

// ---------- layouts ----------

/** Back button + step progress, used at the top of every step screen. */
export function TopBar({ onBack, step, total, title }: { onBack?: () => void; step?: number; total?: number; title?: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/10 hover:bg-black/5"
        >
          <ArrowLeft size={18} />
        </button>
      ) : (
        <div className="size-10 shrink-0" />
      )}
      {step && total ? (
        <div className="flex flex-1 items-center gap-1.5" aria-label={`Step ${step} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-ink" : "bg-black/10"}`} />
          ))}
        </div>
      ) : (
        <p className="flex-1 truncate text-center font-bold">{title}</p>
      )}
      <div className="size-10 shrink-0" />
    </div>
  );
}

export function StepHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="animate-rise mt-2 mb-6">
      <h1 className="text-[1.7rem] leading-tight font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-black/55">{subtitle}</p>}
    </div>
  );
}

/**
 * Full-screen step without a map (login, profile). Phones: one column with the
 * button pinned to the bottom. Tablets/desktop: brand panel on the left.
 */
export function FlowLayout({
  top,
  children,
  footer,
  aside,
}: {
  top?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="stripes hidden bg-ink p-10 text-white md:flex md:flex-col md:justify-between">
        <Logo dark />
        <div>
          {aside ?? (
            <>
              <p className="text-4xl leading-tight font-extrabold">
                Your daily commute,
                <br />
                <span className="text-brand">handled.</span>
              </p>
              <ul className="mt-6 space-y-2 text-white/70">
                <li>• Book once for the whole month</li>
                <li>• A verified backup if your driver can’t come</li>
                <li>• Women-Only always stays Women-Only</li>
              </ul>
            </>
          )}
        </div>
        <p className="text-xs text-white/40">Pilot · Pune</p>
      </aside>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
        {top}
        <div className="flex-1">{children}</div>
        {footer && <div className="sticky bottom-0 bg-gradient-to-t from-canvas via-canvas to-canvas/0 pt-4 pb-5">{footer}</div>}
      </main>
    </div>
  );
}

/**
 * Map + sheet, the Uber pattern. Phones: map on top, sheet slides over it as you scroll.
 * Tablets/desktop: sheet on the left, map fills the right.
 */
export function MapLayout({
  map,
  mapOverlay,
  children,
  footer,
  mapHeight = "h-[42dvh]",
  bottomNav,
}: {
  map: ReactNode;
  mapOverlay?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  mapHeight?: string;
  bottomNav?: ReactNode;
}) {
  return (
    <div className="md:grid md:h-dvh md:grid-cols-[400px_minmax(0,1fr)] lg:grid-cols-[440px_minmax(0,1fr)]">
      <div className={`sticky top-0 z-0 ${mapHeight} md:order-2 md:h-dvh`}>
        {map}
        {mapOverlay && <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] p-3 [&>*]:pointer-events-auto">{mapOverlay}</div>}
      </div>
      <section
        className={`relative z-10 -mt-6 flex min-h-[64dvh] flex-col rounded-t-[28px] bg-canvas shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:order-1 md:mt-0 md:h-dvh md:min-h-0 md:overflow-y-auto md:rounded-none md:border-r md:border-black/10 md:shadow-none ${bottomNav ? "pb-24" : ""}`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-black/15 md:hidden" />
        <div className="flex-1 px-4 pb-4 sm:px-5">{children}</div>
        {footer && (
          <div className="sticky bottom-0 z-20 bg-gradient-to-t from-canvas via-canvas to-canvas/0 px-4 pt-4 pb-5 sm:px-5">
            {footer}
          </div>
        )}
      </section>
      {bottomNav}
    </div>
  );
}

export function BottomNav<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string; icon: LucideIcon; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[900] border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:w-[400px] lg:w-[440px]">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              value === it.id ? "text-ink" : "text-black/40"
            }`}
          >
            <span className={`grid h-8 w-14 place-items-center rounded-full ${value === it.id ? "bg-brand" : ""}`}>
              <it.icon size={19} />
            </span>
            {it.label}
            {!!it.badge && (
              <span className="absolute top-1.5 right-[calc(50%-22px)] grid size-4 place-items-center rounded-full bg-red-600 text-[10px] text-white">
                {it.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ---------- formatting ----------

export function fmtDate(date: string, today: string) {
  if (date === today) return "Today";
  const d = new Date(date + "T00:00");
  const t = new Date(today + "T00:00");
  if (Math.round((d.getTime() - t.getTime()) / 86_400_000) === 1) return "Tomorrow";
  return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })}`;
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function fmtClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function fmtDays(days: string) {
  const list = days.split(",").map(Number);
  const key = list.join(",");
  if (key === "1,2,3,4,5") return "Weekdays";
  if (key === "1,2,3,4,5,6") return "Mon – Sat";
  if (list.length === 7) return "Every day";
  return list.map((d) => DAY_LABELS[d]).join(", ");
}

export function stars(sum: number, count: number) {
  return count ? (sum / count).toFixed(1) : "New";
}

export function forAudience(state: State, key: string) {
  return state.events.filter((e) => e.audience.includes(`,${key},`));
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
