"use client";

import { useState } from "react";
import { AlertTriangle, Building2, Check, ShieldCheck, X } from "lucide-react";
import { DAY_LABELS, placeName, rupees, type Driver, type Plan } from "@/lib/shared";
import {
  Button,
  Card,
  CategoryChip,
  Empty,
  EventFeed,
  PanelShell,
  SectionTitle,
  TripStatusChip,
  fmtDate,
  fmtTime,
  forAudience,
  stars,
  type PanelProps,
} from "./ui";

const ATTENTION = ["REPLACEMENT_SEARCHING", "NO_ELIGIBLE_DRIVER", "ASSIGNMENT_PENDING"];

export function OperatorPanel({ state, act }: PanelProps) {
  const pending = state.plans.filter((p) => p.status === "PENDING_OPERATOR_CONFIRMATION");
  const upcoming = state.trips.filter((t) => t.date >= state.today && t.status !== "CANCELLED_REFUNDED");
  const todayCount = upcoming.filter((t) => t.date === state.today).length;
  const attention = upcoming.filter((t) => ATTENTION.includes(t.status));
  const board = [...attention, ...upcoming.filter((t) => !ATTENTION.includes(t.status))].slice(0, 12);
  const passengerName = (planId: number) => {
    const plan = state.plans.find((p) => p.id === planId);
    return state.passengers.find((p) => p.id === plan?.passenger_id)?.name ?? "—";
  };

  return (
    <PanelShell
      title="Operator dispatch"
      icon={Building2}
      picker={<span className="text-sm font-semibold text-white/70">Saarthi Fleets, Pune</span>}
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Active plans" value={state.plans.filter((p) => p.status === "ACTIVE").length} />
        <Stat label="Trips today" value={todayCount} />
        <Stat label="Need attention" value={attention.length} alert={attention.length > 0} />
      </div>

      <SectionTitle>Plan requests</SectionTitle>
      {pending.length === 0 ? (
        <Empty>No pending requests.</Empty>
      ) : (
        <div className="space-y-2">
          {pending.map((plan) => (
            <PlanRequest key={plan.id} plan={plan} state={state} act={act} />
          ))}
        </div>
      )}

      <SectionTitle>Dispatch board · next 7 days</SectionTitle>
      {board.length === 0 ? (
        <Empty>No trips scheduled.</Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          {board.map((t) => {
            const driver = state.drivers.find((d) => d.id === t.driver_id);
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2 last:border-0 ${
                  ATTENTION.includes(t.status) ? "bg-amber-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    #{t.id} · {fmtDate(t.date, state.today)} {fmtTime(t.time)} · {passengerName(t.plan_id)}
                  </p>
                  <p className="truncate text-xs text-black/50">
                    {driver ? `${driver.name} · ${driver.plate}` : "Unassigned"} · {placeName(t.from_place)} →{" "}
                    {placeName(t.to_place)}
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
      )}

      <SectionTitle>Fleet</SectionTitle>
      <div className="space-y-2">
        {state.drivers.map((d) => (
          <Card key={d.id} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {d.name}
                  {d.women_only_eligible ? <ShieldCheck size={14} className="text-fuchsia-700" /> : null}
                </p>
                <p className="text-xs text-black/50">
                  {d.vehicle} · {d.plate} · ★ {stars(d.rating_sum, d.rating_count)}
                  {d.women_only_eligible ? " · Women-Only eligible" : ""}
                </p>
              </div>
              <button
                onClick={() => act("toggleDuty", { driverId: d.id })}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  d.on_duty ? "bg-emerald-100 text-emerald-800" : "bg-black/10 text-black/50"
                }`}
              >
                {d.on_duty ? "On duty" : "Off duty"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Activity &amp; audit log</SectionTitle>
      <EventFeed events={forAudience(state, "operator")} limit={8} />
    </PanelShell>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${alert ? "bg-amber-100" : "bg-white"} border border-black/10`}>
      <p className="flex items-center gap-1 text-2xl font-extrabold">
        {value} {alert && <AlertTriangle size={16} className="text-amber-600" />}
      </p>
      <p className="text-[11px] font-semibold text-black/50">{label}</p>
    </div>
  );
}

function ineligibleReason(d: Driver, plan: Plan) {
  if (!d.on_duty) return "off duty";
  if (plan.category === "WOMEN_ONLY" && !d.women_only_eligible) return "not Women-Only eligible";
  return null;
}

function PlanRequest({ plan, state, act }: { plan: Plan } & PanelProps) {
  const firstEligible = state.drivers.find((d) => !ineligibleReason(d, plan));
  const [driverId, setDriverId] = useState<number | undefined>(firstEligible?.id);
  const passenger = state.passengers.find((p) => p.id === plan.passenger_id);

  return (
    <Card className="!border-amber-300">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold">{passenger?.name}</p>
        <CategoryChip category={plan.category} />
      </div>
      <p className="mt-1 text-xs text-black/60">
        {placeName(plan.pickup)} → {placeName(plan.dropoff)}
        <br />
        {plan.days.split(",").map((d) => DAY_LABELS[Number(d)]).join(" · ")} · {fmtTime(plan.pickup_time)}
        {plan.return_time ? ` / ${fmtTime(plan.return_time)}` : ""} · {rupees(plan.monthly_price)}/mo
      </p>

      <p className="mt-3 text-xs font-semibold text-black/60">Primary driver</p>
      <div className="mt-1 space-y-1">
        {state.drivers.map((d) => {
          const reason = ineligibleReason(d, plan);
          return (
            <label
              key={d.id}
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs ${
                reason ? "text-black/35" : "cursor-pointer hover:bg-black/5"
              } ${driverId === d.id ? "bg-brand/40" : ""}`}
            >
              <input
                type="radio"
                disabled={!!reason}
                checked={driverId === d.id}
                onChange={() => setDriverId(d.id)}
              />
              <span className="font-semibold">{d.name}</span>
              <span>· {d.vehicle}</span>
              {reason && <span className="ml-auto italic">{reason}</span>}
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="lime"
          className="flex-1"
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
