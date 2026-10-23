"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, LogOut, ShieldCheck, X } from "lucide-react";
import { useNow, useRaahi, useSession, type Act } from "@/lib/client";
import { OPERATOR_PHONE, rupees, type Driver, type Plan, type State } from "@/lib/shared";
import { PhoneLogin } from "../auth/PhoneLogin";
import RaahiMap, { type MapMarker } from "../map/RaahiMap";
import { RouteLines } from "../passenger/Booking";
import { driverPosition } from "../passenger/Rides";
import {
  Button,
  Card,
  CategoryChip,
  Empty,
  EventFeed,
  Logo,
  Splash,
  Toast,
  TripStatusChip,
  fmtDate,
  fmtDays,
  fmtTime,
  forAudience,
  stars,
} from "../ui";

const ATTENTION = ["REPLACEMENT_SEARCHING", "NO_ELIGIBLE_DRIVER", "ASSIGNMENT_PENDING"];
type Tab = "requests" | "dispatch" | "fleet" | "activity";

export default function OperatorApp() {
  const router = useRouter();
  const { state, act, toast, setToast } = useRaahi();
  const [oid, setOid, ready] = useSession("operator");
  const [tab, setTab] = useState<Tab>("requests");

  if (!ready || !state) return <Splash />;
  const toastEl = <Toast message={toast} onClose={() => setToast(null)} />;

  if (!oid) {
    return (
      <>
        <PhoneLogin
          role="operator"
          act={act}
          title="Operator console"
          subtitle="Sign in with your fleet’s registered number."
          demoPhones={[{ label: "Saarthi Fleets", phone: OPERATOR_PHONE }]}
          onBack={() => router.push("/")}
          onVerified={(r) => r.id && setOid(r.id)}
          aside={
            <p className="text-4xl leading-tight font-extrabold">
              Every ride covered,
              <br />
              <span className="text-brand">even when plans change.</span>
            </p>
          }
        />
        {toastEl}
      </>
    );
  }

  const pending = state.plans.filter((p) => p.status === "PENDING_OPERATOR_CONFIRMATION");
  const upcoming = state.trips.filter((t) => t.date >= state.today && t.status !== "CANCELLED_REFUNDED");
  const attention = upcoming.filter((t) => ATTENTION.includes(t.status));

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "requests", label: "Requests", badge: pending.length },
    { id: "dispatch", label: "Dispatch", badge: attention.length },
    { id: "fleet", label: "Fleet" },
    { id: "activity", label: "Activity" },
  ];
  // Phones/tablets: one section per tab. Desktop: everything in two columns.
  const show = (t: Tab) => (tab === t ? "" : "hidden lg:block");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[900] border-b border-black/10 bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="hidden truncate text-sm text-black/50 sm:inline">Saarthi Fleets · Pune</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOid(null)}>
            <LogOut size={14} /> <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                tab === t.id ? "bg-ink text-white" : "bg-white text-black/60 ring-1 ring-black/10"
              }`}
            >
              {t.label}
              {!!t.badge && (
                <span className={`rounded-full px-1.5 text-[11px] ${tab === t.id ? "bg-brand text-ink" : "bg-red-600 text-white"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Active plans" value={state.plans.filter((p) => p.status === "ACTIVE").length} />
          <Stat label="Rides today" value={upcoming.filter((t) => t.date === state.today).length} />
          <Stat label="Need attention" value={attention.length} alert={attention.length > 0} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 space-y-5">
            <section className={show("requests")}>
              <H>Plan requests</H>
              {pending.length === 0 ? (
                <Empty>No new requests. New passenger plans show up here.</Empty>
              ) : (
                <div className="grid gap-3">
                  {pending.map((plan) => (
                    <PlanRequest key={plan.id} plan={plan} state={state} act={act} />
                  ))}
                </div>
              )}
            </section>
            <section className={show("fleet")}>
              <H>Fleet</H>
              <Fleet state={state} act={act} />
            </section>
          </div>
          <div className="min-w-0 space-y-5">
            <section className={show("dispatch")}>
              <H>Live map · today</H>
              <LiveMap state={state} />
              <H>Dispatch board · next 7 days</H>
              <Board state={state} />
            </section>
            <section className={show("activity")}>
              <H>Activity &amp; audit log</H>
              <EventFeed events={forAudience(state, "operator")} limit={12} />
            </section>
          </div>
        </div>
      </main>
      {toastEl}
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1 mb-2 text-xs font-bold tracking-wider text-black/50 uppercase">{children}</h2>;
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-black/10 p-3 sm:p-4 ${alert ? "bg-amber-100" : "bg-white"}`}>
      <p className="flex items-center gap-1 text-2xl font-extrabold sm:text-3xl">
        {value} {alert && <AlertTriangle size={16} className="text-amber-600" />}
      </p>
      <p className="text-[11px] leading-tight font-semibold text-black/50 sm:text-xs">{label}</p>
    </div>
  );
}

function ineligibleReason(d: Driver, plan: Plan) {
  if (!d.on_duty) return "offline";
  if (plan.category === "WOMEN_ONLY" && !d.women_only_eligible) return "not Women-Only eligible";
  return null;
}

function PlanRequest({ plan, state, act }: { plan: Plan; state: State; act: Act }) {
  const firstEligible = state.drivers.find((d) => !ineligibleReason(d, plan));
  const [driverId, setDriverId] = useState<number | undefined>(firstEligible?.id);
  const passenger = state.passengers.find((p) => p.id === plan.passenger_id);

  return (
    <Card className="!border-amber-300">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold">{passenger?.name}</p>
        <CategoryChip category={plan.category} />
      </div>
      <div className="mt-3">
        <RouteLines from={plan.pickup_label} to={plan.dropoff_label} />
      </div>
      <p className="mt-2 text-xs text-black/60">
        {fmtDays(plan.days)} · {fmtTime(plan.pickup_time)}
        {plan.return_time ? ` & ${fmtTime(plan.return_time)}` : ""} · {rupees(plan.monthly_price)}/mo
      </p>

      <p className="mt-4 text-xs font-bold tracking-wider text-black/45 uppercase">Assign primary driver</p>
      <div className="mt-2 space-y-1">
        {state.drivers.map((d) => {
          const reason = ineligibleReason(d, plan);
          return (
            <label
              key={d.id}
              className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl px-3 py-2.5 text-sm ${
                reason ? "text-black/35" : "cursor-pointer hover:bg-black/5"
              } ${driverId === d.id ? "bg-brand/50" : ""}`}
            >
              <input type="radio" disabled={!!reason} checked={driverId === d.id} onChange={() => setDriverId(d.id)} />
              <span className="font-semibold">{d.name}</span>
              <span className="text-xs">· {d.vehicle}</span>
              {reason && <span className="ml-auto text-xs italic">{reason}</span>}
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="lime"
          className="flex-1 whitespace-nowrap"
          disabled={!driverId}
          onClick={() => act("operatorDecision", { planId: plan.id, decision: "approve", primaryDriverId: driverId })}
        >
          <Check size={16} /> Accept plan
        </Button>
        <Button variant="ghost" onClick={() => act("operatorDecision", { planId: plan.id, decision: "reject" })}>
          <X size={16} /> Reject
        </Button>
      </div>
    </Card>
  );
}

function Fleet({ state, act }: { state: State; act: Act }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {state.drivers.map((d) => (
        <Card key={d.id} className="!p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                {d.name}
                {d.women_only_eligible ? <ShieldCheck size={14} className="shrink-0 text-fuchsia-700" /> : null}
              </p>
              <p className="truncate text-xs text-black/50">
                {d.vehicle} · {d.plate} · ★ {stars(d.rating_sum, d.rating_count)}
              </p>
            </div>
            <button
              onClick={() => act("toggleDuty", { driverId: d.id })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                d.on_duty ? "bg-emerald-100 text-emerald-800" : "bg-black/10 text-black/50"
              }`}
            >
              {d.on_duty ? "Online" : "Offline"}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function LiveMap({ state }: { state: State }) {
  const now = useNow(1000);
  const today = state.trips.filter((t) => t.date === state.today && t.status !== "CANCELLED_REFUNDED");
  // Live rides show the moving driver; everything else shows its pickup point.
  const markers: MapMarker[] = today.map((t): MapMarker => {
    const pos = driverPosition(t, now);
    return pos && t.status !== "COMPLETED" ? { ...pos, kind: "driver" } : { lat: t.from_lat, lng: t.from_lng, kind: "dot" };
  });
  return (
    <div className="mb-5 h-64 overflow-hidden rounded-3xl border border-black/10 sm:h-72">
      <RaahiMap markers={markers} focus={`ops-${today.length}`} />
    </div>
  );
}

function Board({ state }: { state: State }) {
  const upcoming = state.trips.filter((t) => t.date >= state.today && t.status !== "CANCELLED_REFUNDED");
  const board = [...upcoming.filter((t) => ATTENTION.includes(t.status)), ...upcoming.filter((t) => !ATTENTION.includes(t.status))].slice(0, 14);
  const passengerName = (planId: number) => {
    const plan = state.plans.find((p) => p.id === planId);
    return state.passengers.find((p) => p.id === plan?.passenger_id)?.name ?? "—";
  };
  if (!board.length) return <Empty>No rides scheduled.</Empty>;
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
      {board.map((t) => {
        const driver = state.drivers.find((d) => d.id === t.driver_id);
        return (
          <div
            key={t.id}
            className={`flex items-start justify-between gap-3 border-b border-black/5 px-4 py-3 last:border-0 ${
              ATTENTION.includes(t.status) ? "bg-amber-50" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-black/45 uppercase">
                {fmtDate(t.date, state.today)} · #{t.id}
              </p>
              <p className="truncate text-sm font-semibold">
                {fmtTime(t.time)} · {passengerName(t.plan_id)}
              </p>
              <p className="truncate text-xs text-black/50">
                {driver ? `${driver.name} · ${driver.plate}` : "Unassigned"}
                <span className="hidden sm:inline">
                  {" "}· {t.from_label} → {t.to_label}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <TripStatusChip status={t.status} />
              {t.category === "WOMEN_ONLY" && <CategoryChip category={t.category} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
