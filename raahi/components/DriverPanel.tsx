"use client";

import { useState } from "react";
import { Car, CircleOff, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { placeName, type Trip, type TripStatus } from "@/lib/shared";
import {
  Button,
  Card,
  CategoryChip,
  Empty,
  EventFeed,
  LatestBanner,
  PanelShell,
  Picker,
  SectionTitle,
  TripStatusChip,
  fmtDate,
  fmtTime,
  forAudience,
  stars,
  type PanelProps,
} from "./ui";

const NEXT_ACTION: Partial<Record<TripStatus, string>> = {
  CONFIRMED: "Head to pickup",
  DRIVER_EN_ROUTE: "I've arrived",
  ARRIVED: "Start trip",
  IN_PROGRESS: "Complete trip",
};

const REASONS = ["Feeling sick", "Vehicle breakdown", "Personal emergency"];

export function DriverPanel({ state, act }: PanelProps) {
  const [did, setDid] = useState(1);
  const me = state.drivers.find((d) => d.id === did) ?? state.drivers[0];
  if (!me) return null;

  const trips = state.trips
    .filter((t) => t.driver_id === me.id && t.date >= state.today && t.status !== "CANCELLED_REFUNDED")
    .slice(0, 8);
  const events = forAudience(state, `driver:${me.id}`);

  return (
    <PanelShell title="Driver app" icon={Car} picker={<Picker value={me.id} options={state.drivers} onChange={setDid} />}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-black/60">
          {me.vehicle} · {me.plate} · ★ {stars(me.rating_sum, me.rating_count)}
          {me.women_only_eligible ? (
            <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-fuchsia-800">
              <ShieldCheck size={12} /> Women-Only verified
            </span>
          ) : null}
        </p>
        <button
          onClick={() => act("toggleDuty", { driverId: me.id })}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${me.on_duty ? "bg-emerald-100 text-emerald-800" : "bg-black/10 text-black/50"}`}
        >
          {me.on_duty ? "● On duty" : "○ Off duty"}
        </button>
      </div>

      <LatestBanner event={events[0]} />

      <SectionTitle>My trips</SectionTitle>
      {trips.length === 0 ? (
        <Empty>No trips assigned. Your schedule shows up here once the operator assigns you.</Empty>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
          {trips.map((t) => (
            <DriverTrip key={t.id} trip={t} driverId={me.id} state={state} act={act} />
          ))}
        </div>
      )}

      <SectionTitle>Notifications</SectionTitle>
      <EventFeed events={events} limit={5} />
    </PanelShell>
  );
}

function DriverTrip({ trip, driverId, state, act }: { trip: Trip; driverId: number } & PanelProps) {
  const [reporting, setReporting] = useState(false);
  const plan = state.plans.find((p) => p.id === trip.plan_id);
  const passenger = state.passengers.find((p) => p.id === plan?.passenger_id);
  const next = NEXT_ACTION[trip.status];
  const canRelease = trip.status === "CONFIRMED" || trip.status === "DRIVER_EN_ROUTE";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-black/45 uppercase">{fmtDate(trip.date, state.today)}</p>
          <p className="text-lg leading-tight font-extrabold">{fmtTime(trip.time)}</p>
        </div>
        <TripStatusChip status={trip.status} />
      </div>
      {/* Drivers see only what they need: first name and pickup point. */}
      <p className="mt-1 text-xs">
        Passenger: <b>{passenger?.name.split(" ")[0]}</b>
      </p>
      <p className="flex items-start gap-1 text-xs text-black/60">
        <MapPin size={12} className="mt-0.5 shrink-0" />
        <span className="min-w-0">
          {placeName(trip.from_place)} → {placeName(trip.to_place)}
        </span>
      </p>
      <div className="mt-2">
        <CategoryChip category={trip.category} />
      </div>

      {next && !reporting && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button variant="lime" className="whitespace-nowrap" onClick={() => act("tripProgress", { tripId: trip.id, driverId })}>
            <Navigation size={15} /> {next}
          </Button>
          {canRelease && (
            <Button variant="ghost" className="whitespace-nowrap" onClick={() => setReporting(true)}>
              <CircleOff size={15} /> Can’t make it
            </Button>
          )}
        </div>
      )}

      {reporting && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3">
          <p className="text-xs font-semibold">Why can’t you do this trip? Dispatch will auto-assign a backup.</p>
          <div className="mt-2 grid gap-2 sm:flex sm:flex-wrap">
            {REASONS.map((r) => (
              <Button
                key={r}
                variant="dark"
                className="!py-1.5 text-xs"
                onClick={async () => {
                  await act("driverUnavailable", { tripId: trip.id, driverId, reason: r });
                  setReporting(false);
                }}
              >
                {r}
              </Button>
            ))}
            <Button variant="ghost" className="!py-1.5 text-xs" onClick={() => setReporting(false)}>
              Never mind
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
