"use client";

import { useState } from "react";
import { ArrowRight, Info, MapPin, Plus, ShieldAlert, ShieldCheck, Star, UserRound, X } from "lucide-react";
import {
  DAY_LABELS,
  DURATIONS,
  PLACES,
  placeName,
  quote,
  rupees,
  type Category,
  type Duration,
  type Passenger,
  type Trip,
} from "@/lib/shared";
import {
  Button,
  Card,
  CategoryChip,
  Empty,
  EventFeed,
  LatestBanner,
  PanelShell,
  Picker,
  PlanStatusChip,
  SectionTitle,
  TripStatusChip,
  fmtDate,
  fmtTime,
  forAudience,
  stars,
  type Act,
  type PanelProps,
} from "./ui";

export function PassengerPanel({ state, act }: PanelProps) {
  const [pid, setPid] = useState(1);
  const [creating, setCreating] = useState(false);
  const me = state.passengers.find((p) => p.id === pid) ?? state.passengers[0];
  if (!me) return null;

  const plans = state.plans.filter((p) => p.passenger_id === me.id);
  const planIds = new Set(plans.map((p) => p.id));
  const trips = state.trips.filter((t) => planIds.has(t.plan_id) && t.date >= state.today).slice(0, 8);
  const events = forAudience(state, `passenger:${me.id}`);

  return (
    <PanelShell
      title="Passenger app"
      icon={UserRound}
      picker={<Picker value={me.id} options={state.passengers} onChange={(v) => { setPid(v); setCreating(false); }} />}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-black/60">
        {me.women_verified ? (
          <span className="inline-flex items-center gap-1 font-semibold text-fuchsia-800">
            <ShieldCheck size={14} /> Verified for Women-Only
          </span>
        ) : (
          <span>Standard account</span>
        )}
        {me.credit > 0 && <span className="rounded-full bg-brand px-2 py-0.5 font-semibold text-ink">Credit {rupees(me.credit)}</span>}
      </div>

      <LatestBanner event={events[0]} />

      {creating ? (
        <PlanForm me={me} act={act} onDone={() => setCreating(false)} />
      ) : (
        <>
          <SectionTitle
            right={
              <Button variant="lime" className="!px-3 !py-1 text-xs" onClick={() => setCreating(true)}>
                <Plus size={14} /> New plan
              </Button>
            }
          >
            My commute plans
          </SectionTitle>
          {plans.length === 0 ? (
            <Empty>No plans yet. Set up your daily commute once and Raahi handles the rest.</Empty>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <PlanStatusChip status={plan.status} />
                    <CategoryChip category={plan.category} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
                    {placeName(plan.pickup)} <ArrowRight size={14} /> {placeName(plan.dropoff)}
                  </p>
                  <p className="text-xs text-black/60">
                    {plan.days.split(",").map((d) => DAY_LABELS[Number(d)]).join(" · ")} · {fmtTime(plan.pickup_time)}
                    {plan.return_time ? ` · return ${fmtTime(plan.return_time)}` : ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm">
                      <b>{rupees(plan.monthly_price)}</b>
                      <span className="text-black/50">/month · {DURATIONS[plan.duration].label}</span>
                    </p>
                    {plan.status === "PENDING_PAYMENT" && (
                      <Button variant="lime" onClick={() => act("payPlan", { planId: plan.id, passengerId: me.id })}>
                        Pay {rupees(plan.monthly_price)} (demo)
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <SectionTitle>Upcoming trips</SectionTitle>
          {trips.length === 0 ? (
            <Empty>Trips appear here once a plan is active.</Empty>
          ) : (
            <div className="space-y-2">
              {trips.map((t) => (
                <PassengerTrip key={t.id} trip={t} me={me} state={state} act={act} />
              ))}
            </div>
          )}
        </>
      )}

      <SectionTitle>Notifications</SectionTitle>
      <EventFeed events={events} limit={5} />
    </PanelShell>
  );
}

function PassengerTrip({ trip, me, state, act }: { trip: Trip; me: Passenger } & PanelProps) {
  const driver = state.drivers.find((d) => d.id === trip.driver_id);
  const live = ["DRIVER_EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(trip.status);
  const ids = { tripId: trip.id, passengerId: me.id };

  return (
    <Card className={trip.status === "NO_ELIGIBLE_DRIVER" ? "!border-red-300" : ""}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">
          {fmtDate(trip.date, state.today)} · {fmtTime(trip.time)}
          <span className="ml-1 font-normal text-black/50">{trip.direction === "RETURN" ? "Return" : "Outbound"}</span>
        </p>
        <TripStatusChip status={trip.status} />
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-black/60">
        <MapPin size={12} /> {placeName(trip.from_place)} → {placeName(trip.to_place)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CategoryChip category={trip.category} />
        {driver ? (
          <span className="text-xs">
            <b>{driver.name}</b> · {driver.vehicle} · {driver.plate} · ★ {stars(driver.rating_sum, driver.rating_count)}
          </span>
        ) : (
          <span className="text-xs text-black/50">Driver not assigned yet</span>
        )}
      </div>

      {trip.status === "NO_ELIGIBLE_DRIVER" && (
        <div className="mt-3 rounded-2xl bg-red-50 p-3">
          <p className="text-xs text-red-800">
            {trip.category === "WOMEN_ONLY"
              ? "No eligible Women-Only driver yet. Your booking will not be switched to Standard unless you choose it."
              : "No eligible driver yet. Choose what you'd like to do."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="ghost" className="!py-1.5 text-xs" onClick={() => act("passengerRecovery", { ...ids, choice: "wait" })}>
              Keep waiting
            </Button>
            <Button variant="dark" className="!py-1.5 text-xs" onClick={() => act("passengerRecovery", { ...ids, choice: "cancel" })}>
              Cancel · refund {rupees(trip.fare)}
            </Button>
            {trip.category === "WOMEN_ONLY" && (
              <Button
                variant="ghost"
                className="!py-1.5 text-xs"
                onClick={() => act("passengerRecovery", { ...ids, choice: "switch_standard" })}
              >
                Switch this trip to Standard
              </Button>
            )}
          </div>
        </div>
      )}

      {live && (
        <Button variant="danger" className="mt-3 w-full" onClick={() => act("safetyReport", ids)}>
          <ShieldAlert size={16} /> Safety help
        </Button>
      )}

      {trip.status === "COMPLETED" && !trip.rated && driver && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-black/60">Rate {driver.name.split(" ")[0]}:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => act("rateDriver", { ...ids, stars: n })} aria-label={`${n} stars`}>
              <Star size={20} className="text-amber-400 hover:fill-amber-400" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function PlanForm({ me, act, onDone }: { me: Passenger; act: Act; onDone: () => void }) {
  const [pickup, setPickup] = useState<string>("kothrud");
  const [dropoff, setDropoff] = useState<string>("fc-road");
  const [days, setDays] = useState<number[]>(() => {
    // Default to weekdays, plus today so the demo always has a trip today.
    const set = new Set([1, 2, 3, 4, 5, new Date().getDay()]);
    return [...set].sort();
  });
  const [pickupTime, setPickupTime] = useState("08:30");
  const [hasReturn, setHasReturn] = useState(true);
  const [returnTime, setReturnTime] = useState("17:30");
  const [category, setCategory] = useState<Category>(me.women_verified ? "WOMEN_ONLY" : "STANDARD");
  const [duration, setDuration] = useState<Duration>("MONTHLY");

  const q = quote({ pickup, dropoff, days, hasReturn, duration });
  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const submit = async () => {
    const ok = await act("createPlan", {
      passengerId: me.id,
      pickup,
      dropoff,
      days,
      pickupTime,
      returnTime: hasReturn ? returnTime : null,
      category,
      duration,
    });
    if (ok) onDone();
  };

  const select = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm";

  return (
    <Card className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Create commute plan</h3>
        <button onClick={onDone} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold text-black/60">
          Pickup
          <select className={select} value={pickup} onChange={(e) => setPickup(e.target.value)}>
            {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-black/60">
          Drop-off
          <select className={select} value={dropoff} onChange={(e) => setDropoff(e.target.value)}>
            {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs font-semibold text-black/60">Travel days</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {DAY_LABELS.map((label, d) => (
          <button
            key={label}
            onClick={() => toggleDay(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${days.includes(d) ? "bg-ink text-white" : "bg-black/5"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold text-black/60">
          Pickup time
          <input type="time" className={select} value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-black/60">
          <span className="flex items-center gap-1">
            <input type="checkbox" checked={hasReturn} onChange={(e) => setHasReturn(e.target.checked)} /> Return trip
          </span>
          <input type="time" disabled={!hasReturn} className={select} value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
        </label>
      </div>

      <p className="mt-3 text-xs font-semibold text-black/60">Service category</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {(["STANDARD", "WOMEN_ONLY"] as Category[]).map((c) => {
          const locked = c === "WOMEN_ONLY" && !me.women_verified;
          return (
            <button
              key={c}
              disabled={locked}
              onClick={() => setCategory(c)}
              className={`rounded-2xl border p-2 text-left text-xs disabled:opacity-40 ${
                category === c ? "border-ink bg-ink text-white" : "border-black/10 bg-white"
              }`}
            >
              <span className="flex items-center gap-1 font-bold">
                {c === "WOMEN_ONLY" && <ShieldCheck size={14} />} {c === "WOMEN_ONLY" ? "Women-Only" : "Standard"}
              </span>
              <span className="opacity-70">
                {c === "WOMEN_ONLY" ? (locked ? "Needs verified woman account" : "Verified women drivers only") : "Any verified driver"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-semibold text-black/60">Plan length</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {(Object.keys(DURATIONS) as Duration[]).map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${duration === d ? "bg-ink text-white" : "bg-black/5"}`}
          >
            {DURATIONS[d].label}
          </button>
        ))}
      </div>

      <div className="stripes mt-4 rounded-2xl bg-ink p-4 text-white">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/60">Your plan</p>
            <p className="text-2xl font-extrabold text-brand">
              {rupees(q.monthly)}
              <span className="text-sm font-semibold text-white/60">/month</span>
            </p>
          </div>
          <p className="text-right text-xs text-white/60">
            {q.km} km · ~{q.tripsPerMonth} trips/month
            <br />
            {rupees(q.perTrip)} per ride if booked daily
          </p>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-white/70">
          <li>• You subscribe to a service, not one driver. If your driver can’t come, an eligible backup is sent.</li>
          {category === "WOMEN_ONLY" && <li>• Women-Only stays Women-Only. We never switch it without your explicit choice.</li>}
          <li>• No charge until the operator confirms they have capacity.</li>
          <li>• No trip, no fare: if we can’t serve a trip, you get it back as credit.</li>
        </ul>
      </div>

      <Button variant="lime" className="mt-3 w-full !py-3" onClick={submit} disabled={!days.length || pickup === dropoff}>
        Request plan <ArrowRight size={16} />
      </Button>
      {pickup === dropoff && (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <Info size={12} /> Pickup and drop-off must be different.
        </p>
      )}
    </Card>
  );
}
