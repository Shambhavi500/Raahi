"use client";

import { useState } from "react";
import { ArrowLeft, Check, CreditCard, Loader2, Phone, ShieldAlert, ShieldCheck, Smartphone, Star } from "lucide-react";
import { useNow, type Act } from "@/lib/client";
import { DURATIONS, curvePoint, rupees, type Driver, type Passenger, type Plan, type State, type Trip } from "@/lib/shared";
import RaahiMap, { type MapMarker } from "../map/RaahiMap";
import {
  Avatar,
  Button,
  Card,
  CategoryChip,
  Empty,
  MapLayout,
  PlanStatusChip,
  SectionTitle,
  StepHeading,
  TopBar,
  TripStatusChip,
  fmtDate,
  fmtDays,
  fmtTime,
  stars,
} from "../ui";
import { RouteLines } from "./Booking";

export const LIVE = ["DRIVER_EN_ROUTE", "ARRIVED", "IN_PROGRESS"];

// Simulated driver position so the map moves during the demo (no GPS in the pilot build).
export function driverPosition(trip: Trip, now: number) {
  const from = { lat: trip.from_lat, lng: trip.from_lng };
  const to = { lat: trip.to_lat, lng: trip.to_lng };
  const since = (now - new Date(trip.status_at).getTime()) / 1000;
  const ease = (t: number) => 1 - (1 - t) ** 2;
  if (trip.status === "DRIVER_EN_ROUTE") {
    const start = { lat: from.lat + 0.018, lng: from.lng - 0.022 };
    const t = ease(Math.min(since / 45, 0.96));
    return { lat: start.lat + (from.lat - start.lat) * t, lng: start.lng + (from.lng - start.lng) * t };
  }
  if (trip.status === "ARRIVED") return from;
  if (trip.status === "IN_PROGRESS") return curvePoint(from, to, ease(Math.min(since / 60, 0.97)));
  if (trip.status === "COMPLETED") return to;
  return null;
}

export function tripMap(trip: Trip, now: number, focus: string) {
  const pos = driverPosition(trip, now);
  const markers: MapMarker[] = [
    { lat: trip.from_lat, lng: trip.from_lng, kind: "pickup" },
    { lat: trip.to_lat, lng: trip.to_lng, kind: "drop" },
    ...(pos ? [{ ...pos, kind: "driver" as const }] : []),
  ];
  return (
    <RaahiMap
      route={{ from: { lat: trip.from_lat, lng: trip.from_lng }, to: { lat: trip.to_lat, lng: trip.to_lng } }}
      markers={markers}
      focus={focus}
    />
  );
}

export function planMap(plan: Plan) {
  const from = { lat: plan.pickup_lat, lng: plan.pickup_lng };
  const to = { lat: plan.dropoff_lat, lng: plan.dropoff_lng };
  return (
    <RaahiMap
      route={{ from, to }}
      markers={[
        { ...from, kind: "pickup" },
        { ...to, kind: "drop" },
      ]}
      focus={`plan-${plan.id}`}
    />
  );
}

export function DriverRow({ driver, womenOnly }: { driver: Driver; womenOnly?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={driver.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{driver.name}</p>
        <p className="flex items-center gap-1 text-xs text-black/55">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {stars(driver.rating_sum, driver.rating_count)} ·{" "}
          {driver.vehicle}
          {womenOnly && driver.women_only_eligible ? (
            <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-fuchsia-800">
              <ShieldCheck size={12} /> Verified
            </span>
          ) : null}
        </p>
      </div>
      <span className="shrink-0 rounded-lg border-2 border-ink bg-brand px-2 py-1 font-mono text-xs font-bold">{driver.plate}</span>
    </div>
  );
}

// ---------- plan status (after requesting) ----------

export function PlanView({
  plan,
  state,
  me,
  act,
  onBack,
  onOpenTrip,
  onBookAgain,
}: {
  plan: Plan;
  state: State;
  me: Passenger;
  act: Act;
  onBack: () => void;
  onOpenTrip: (id: number) => void;
  onBookAgain: () => void;
}) {
  const [method, setMethod] = useState<"UPI" | "Card">("UPI");
  const [busy, setBusy] = useState(false);
  const driver = state.drivers.find((d) => d.id === plan.primary_driver_id);
  const firstTrip = state.trips.find((t) => t.plan_id === plan.id && t.date >= state.today && t.status !== "COMPLETED");
  const s = plan.status;

  const pay = async () => {
    setBusy(true);
    await act("payPlan", { planId: plan.id, passengerId: me.id, method });
    setBusy(false);
  };

  const steps = [
    { label: "Plan requested", done: true },
    { label: "Operator confirms your rides", done: s === "PENDING_PAYMENT" || s === "ACTIVE", current: s === "PENDING_OPERATOR_CONFIRMATION" },
    { label: "You pay", done: s === "ACTIVE", current: s === "PENDING_PAYMENT" },
    { label: "Rides scheduled with your driver", done: s === "ACTIVE" },
  ];

  const footer =
    s === "PENDING_PAYMENT" ? (
      <Button variant="lime" size="lg" disabled={busy} onClick={pay}>
        {busy ? "Processing…" : `Pay ${rupees(plan.monthly_price)} with ${method} (demo)`}
      </Button>
    ) : s === "ACTIVE" ? (
      <Button size="lg" onClick={onBack}>
        Done
      </Button>
    ) : s === "REJECTED" ? (
      <Button size="lg" onClick={onBookAgain}>
        Try another time or route
      </Button>
    ) : null;

  return (
    <MapLayout map={planMap(plan)} mapHeight="h-[32dvh]" footer={footer}>
      <TopBar onBack={onBack} title="Your plan" />

      {s === "PENDING_OPERATOR_CONFIRMATION" && (
        <StepHeading
          title="Finding you an operator…"
          subtitle="A verified fleet near your route is checking they have room for every ride. This usually takes a few minutes."
        />
      )}
      {s === "PENDING_PAYMENT" && (
        <StepHeading title="You’re confirmed!" subtitle="Pay to lock in your rides. Your driver is ready." />
      )}
      {s === "ACTIVE" && (
        <div className="mb-6 text-center">
          <div className="animate-pop mx-auto mt-2 grid size-16 place-items-center rounded-full bg-brand">
            <Check size={32} strokeWidth={3} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">You’re all set, {me.name.split(" ")[0]}!</h1>
          <p className="mt-1 text-sm text-black/55">Your rides are booked. We’ll remind you before each one.</p>
        </div>
      )}
      {s === "REJECTED" && (
        <StepHeading
          title="No operator available right now"
          subtitle="There isn’t enough room on this route at that time. You have not been charged."
        />
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PlanStatusChip status={s} />
          <CategoryChip category={plan.category} />
        </div>
        <RouteLines from={plan.pickup_label} to={plan.dropoff_label} />
        <p className="mt-3 text-sm text-black/60">
          {fmtDays(plan.days)} · {fmtTime(plan.pickup_time)}
          {plan.return_time ? ` & ${fmtTime(plan.return_time)}` : ""}
        </p>
        <p className="mt-1 text-sm">
          <b>{rupees(plan.monthly_price)}</b>
          <span className="text-black/50">/month · {DURATIONS[plan.duration].label}</span>
        </p>
      </Card>

      {s !== "REJECTED" && s !== "ACTIVE" && (
        <ol className="mt-5 space-y-0">
          {steps.map((st, i) => (
            <li key={st.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid size-7 place-items-center rounded-full ${
                    st.done ? "bg-ink text-brand" : st.current ? "bg-brand text-ink" : "bg-black/10 text-black/40"
                  }`}
                >
                  {st.done ? <Check size={15} strokeWidth={3} /> : st.current ? <Loader2 size={15} className="animate-spin" /> : i + 1}
                </span>
                {i < steps.length - 1 && <span className={`w-0.5 flex-1 ${st.done ? "bg-ink" : "bg-black/10"} min-h-5`} />}
              </div>
              <p className={`pt-1 pb-4 text-sm ${st.current ? "font-bold" : st.done ? "font-semibold" : "text-black/45"}`}>
                {st.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {driver && s === "PENDING_PAYMENT" && (
        <>
          <SectionTitle>Your driver</SectionTitle>
          <Card>
            <DriverRow driver={driver} womenOnly={plan.category === "WOMEN_ONLY"} />
            <p className="mt-3 text-xs text-black/55">
              If {driver.name.split(" ")[0]} can’t come someday, a verified backup is sent automatically.
            </p>
          </Card>
          <SectionTitle>Pay with</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["UPI", Smartphone, "GPay, PhonePe…"],
                ["Card", CreditCard, "Debit or credit"],
              ] as const
            ).map(([id, Icon, sub]) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`rounded-2xl border-2 bg-white p-3 text-left ${method === id ? "border-ink" : "border-transparent ring-1 ring-black/10"}`}
              >
                <Icon size={18} />
                <span className="mt-1 block font-bold">{id}</span>
                <span className="block text-[11px] text-black/50">{sub}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {s === "ACTIVE" && firstTrip && (
        <>
          <SectionTitle>Your first ride</SectionTitle>
          <RideCard trip={firstTrip} state={state} onClick={() => onOpenTrip(firstTrip.id)} />
        </>
      )}
    </MapLayout>
  );
}

// ---------- one ride ----------

const HEADLINE: Record<string, (who: string, t: Trip) => [string, string]> = {
  ASSIGNMENT_PENDING: () => ["Assigning your driver", "We’re setting up a verified driver for this ride."],
  CONFIRMED: (who, t) => ["Your ride is confirmed", `${who} will pick you up at ${fmtTime(t.time)}.`],
  REPLACEMENT_SEARCHING: () => ["Finding a verified backup…", "Your driver can’t make it. Sit tight, we’re on it."],
  NO_ELIGIBLE_DRIVER: () => ["We need your choice", "No eligible driver is free yet. Choose what you’d like to do."],
  DRIVER_EN_ROUTE: (who) => [`${who} is on the way`, "Head to your pickup point."],
  ARRIVED: (who, t) => [`${who} has arrived`, `Meet at ${t.from_label}. Free waiting: 5 minutes.`],
  IN_PROGRESS: (_, t) => [`Heading to ${t.to_label}`, "Enjoy the ride. Safety help is one tap away."],
  COMPLETED: () => ["You’ve arrived!", "This ride was covered by your plan."],
  CANCELLED_REFUNDED: (_, t) => ["Ride cancelled", `${rupees(t.fare)} was added to your Raahi credit.`],
};

const PROGRESS = ["CONFIRMED", "DRIVER_EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"];
const PROGRESS_LABELS = ["Confirmed", "On the way", "Arrived", "On ride", "Done"];

export function TripView({
  trip,
  state,
  me,
  act,
  onBack,
}: {
  trip: Trip;
  state: State;
  me: Passenger;
  act: Act;
  onBack: () => void;
}) {
  const now = useNow(1000);
  const [rating, setRating] = useState(0);
  const driver = state.drivers.find((d) => d.id === trip.driver_id);
  const who = driver ? driver.name.split(" ")[0] : "Your driver";
  const [title, sub] = HEADLINE[trip.status](who, trip);
  const stepIdx = PROGRESS.indexOf(trip.status);
  const ids = { tripId: trip.id, passengerId: me.id };

  return (
    <MapLayout
      map={tripMap(trip, now, `trip-${trip.id}`)}
      mapOverlay={
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid size-11 place-items-center rounded-full bg-white shadow-lg md:hidden"
        >
          <ArrowLeft size={19} />
        </button>
      }
    >
      <div className="hidden md:block">
        <TopBar onBack={onBack} title="Ride" />
      </div>
      <div className="pt-4 md:pt-0">
        <p className="text-xs font-bold tracking-wider text-black/45 uppercase">
          {fmtDate(trip.date, state.today)} · {fmtTime(trip.time)} · {trip.direction === "RETURN" ? "Return" : "Outbound"}
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl leading-tight font-extrabold">
          {trip.status === "REPLACEMENT_SEARCHING" && <Loader2 size={22} className="animate-spin" />}
          {title}
        </h1>
        <p className="mt-1 text-sm text-black/55">{sub}</p>
      </div>

      {stepIdx >= 0 && (
        <div className="mt-4 grid grid-cols-5 gap-1">
          {PROGRESS_LABELS.map((l, i) => (
            <div key={l}>
              <div className={`h-1.5 rounded-full ${i <= stepIdx ? "bg-ink" : "bg-black/10"}`} />
              <p className={`mt-1 text-[10px] font-semibold ${i === stepIdx ? "text-ink" : "text-black/40"}`}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {trip.status === "NO_ELIGIBLE_DRIVER" && (
        <div className="mt-4 grid gap-2">
          {trip.category === "WOMEN_ONLY" && (
            <p className="rounded-2xl bg-fuchsia-50 p-3 text-xs text-fuchsia-900">
              <ShieldCheck size={14} className="mr-1 inline" />
              Your ride stays Women-Only. We will never switch it unless you choose to.
            </p>
          )}
          <Button variant="outline" size="lg" onClick={() => act("passengerRecovery", { ...ids, choice: "wait" })}>
            Keep waiting for an eligible driver
          </Button>
          <Button size="lg" onClick={() => act("passengerRecovery", { ...ids, choice: "cancel" })}>
            Cancel this ride · {rupees(trip.fare)} refund
          </Button>
          {trip.category === "WOMEN_ONLY" && (
            <Button variant="ghost" size="lg" onClick={() => act("passengerRecovery", { ...ids, choice: "switch_standard" })}>
              Switch just this ride to Standard
            </Button>
          )}
        </div>
      )}

      {driver && (
        <Card className="mt-4">
          <DriverRow driver={driver} womenOnly={trip.category === "WOMEN_ONLY"} />
          {LIVE.includes(trip.status) && (
            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-black/5 px-3 py-2.5 text-xs text-black/60">
              <Phone size={14} className="shrink-0" /> Calls with {who} go through a private number, so neither of you sees
              the other’s phone.
            </p>
          )}
        </Card>
      )}

      <Card className="mt-3">
        <RouteLines from={trip.from_label} to={trip.to_label} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CategoryChip category={trip.category} />
          <span className="text-xs text-black/50">Covered by your plan</span>
        </div>
      </Card>

      {LIVE.includes(trip.status) && (
        <Button variant="danger" size="lg" className="mt-4" onClick={() => act("safetyReport", ids)}>
          <ShieldAlert size={18} /> Safety help
        </Button>
      )}

      {trip.status === "COMPLETED" && driver && (
        <Card className="mt-4 text-center">
          {trip.rated ? (
            <p className="font-semibold">Thanks for rating {who}!</p>
          ) : (
            <>
              <p className="font-bold">How was your ride with {who}?</p>
              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-1">
                    <Star size={34} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-black/20"} />
                  </button>
                ))}
              </div>
              <Button className="mt-3 w-full" disabled={!rating} onClick={() => act("rateDriver", { ...ids, stars: rating })}>
                Submit rating
              </Button>
              <p className="mt-2 text-[11px] text-black/45">Ratings are private. To report a problem, use Safety help.</p>
            </>
          )}
        </Card>
      )}
    </MapLayout>
  );
}

// ---------- lists ----------

export function RideCard({ trip, state, onClick }: { trip: Trip; state: State; onClick: () => void }) {
  const driver = state.drivers.find((d) => d.id === trip.driver_id);
  return (
    <Card onClick={onClick} className={trip.status === "NO_ELIGIBLE_DRIVER" ? "!border-red-300" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-black/45 uppercase">
            {fmtDate(trip.date, state.today)} · {trip.direction === "RETURN" ? "Return" : "Outbound"}
          </p>
          <p className="text-lg leading-tight font-extrabold">{fmtTime(trip.time)}</p>
        </div>
        <TripStatusChip status={trip.status} />
      </div>
      <p className="mt-1 truncate text-sm text-black/60">
        {trip.from_label} → {trip.to_label}
      </p>
      <p className="mt-1 truncate text-xs text-black/50">
        {driver ? `${driver.name} · ${driver.plate}` : "Driver being assigned"}
      </p>
    </Card>
  );
}

export function RidesTab({
  me,
  state,
  onOpenTrip,
  onOpenPlan,
}: {
  me: Passenger;
  state: State;
  onOpenTrip: (id: number) => void;
  onOpenPlan: (id: number) => void;
}) {
  const plans = state.plans.filter((p) => p.passenger_id === me.id);
  const planIds = new Set(plans.map((p) => p.id));
  const mine = state.trips.filter((t) => planIds.has(t.plan_id));
  const upcoming = mine.filter((t) => t.date >= state.today && !["COMPLETED", "CANCELLED_REFUNDED"].includes(t.status));
  const past = mine.filter((t) => ["COMPLETED", "CANCELLED_REFUNDED"].includes(t.status)).reverse();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Your rides</h1>

      <SectionTitle>Plans</SectionTitle>
      {plans.length === 0 ? (
        <Empty>No plans yet.</Empty>
      ) : (
        <div className="grid gap-2">
          {plans.map((p) => (
            <Card key={p.id} onClick={() => onOpenPlan(p.id)}>
              <div className="flex flex-wrap items-center gap-2">
                <PlanStatusChip status={p.status} />
                <CategoryChip category={p.category} />
              </div>
              <p className="mt-2 truncate font-semibold">
                {p.pickup_label} → {p.dropoff_label}
              </p>
              <p className="text-xs text-black/55">
                {fmtDays(p.days)} · {fmtTime(p.pickup_time)} · {rupees(p.monthly_price)}/month
              </p>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>Upcoming</SectionTitle>
      {upcoming.length === 0 ? (
        <Empty>No upcoming rides.</Empty>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {upcoming.map((t) => (
            <RideCard key={t.id} trip={t} state={state} onClick={() => onOpenTrip(t.id)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <SectionTitle>Past</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {past.map((t) => (
              <RideCard key={t.id} trip={t} state={state} onClick={() => onOpenTrip(t.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
