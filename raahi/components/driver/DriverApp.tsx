"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CircleOff, LogOut, Navigation, ShieldCheck, Star, UserRound } from "lucide-react";
import { useNow, useRaahi, useSession } from "@/lib/client";
import type { Driver, State, Trip, TripStatus } from "@/lib/shared";
import { PhoneLogin } from "../auth/PhoneLogin";
import RaahiMap from "../map/RaahiMap";
import { RouteLines } from "../passenger/Booking";
import { tripMap } from "../passenger/Rides";
import {
  Avatar,
  BottomNav,
  Button,
  Card,
  CategoryChip,
  Empty,
  EventFeed,
  FreshBanner,
  MapLayout,
  SectionTitle,
  Splash,
  Toast,
  TripStatusChip,
  fmtDate,
  fmtTime,
  forAudience,
  stars,
} from "../ui";

const NEXT_ACTION: Partial<Record<TripStatus, string>> = {
  CONFIRMED: "Start: head to pickup",
  DRIVER_EN_ROUTE: "I’ve arrived at pickup",
  ARRIVED: "Passenger is in · start ride",
  IN_PROGRESS: "Complete ride",
};

const REASONS = ["Feeling sick", "Vehicle breakdown", "Personal emergency"];

export default function DriverApp() {
  const router = useRouter();
  const { state, act, toast, setToast } = useRaahi();
  const [did, setDid, ready] = useSession("driver");
  const [tab, setTab] = useState<"today" | "account">("today");

  if (!ready || !state) return <Splash />;
  const me = did ? state.drivers.find((d) => d.id === did) : undefined;
  const toastEl = <Toast message={toast} onClose={() => setToast(null)} />;

  if (!me) {
    return (
      <>
        <PhoneLogin
          role="driver"
          act={act}
          title="Driver login"
          subtitle="Use the mobile number your fleet operator registered for you."
          demoPhones={state.drivers.map((d) => ({ label: d.name, phone: d.phone }))}
          onBack={() => router.push("/")}
          onVerified={(r) => r.id && setDid(r.id)}
          aside={
            <p className="text-4xl leading-tight font-extrabold">
              Steady work,
              <br />
              <span className="text-brand">planned ahead.</span>
            </p>
          }
        />
        {toastEl}
      </>
    );
  }

  const nav = (
    <BottomNav
      items={[
        { id: "today" as const, label: "Today", icon: CalendarClock },
        { id: "account" as const, label: "Account", icon: UserRound },
      ]}
      value={tab}
      onChange={setTab}
    />
  );

  return (
    <>
      {tab === "today" ? (
        <DriverToday me={me} state={state} act={act} nav={nav} />
      ) : (
        <>
          <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-6">
            <div className="flex items-center gap-4">
              <Avatar name={me.name} className="size-16 text-lg" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold">{me.name}</h1>
                <p className="text-sm text-black/55">Saarthi Fleets · Pune</p>
              </div>
            </div>
            <SectionTitle>Vehicle</SectionTitle>
            <Card>
              <p className="font-bold">{me.vehicle}</p>
              <p className="font-mono text-sm">{me.plate}</p>
              {me.women_only_eligible ? (
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-800">
                  <ShieldCheck size={15} /> Verified for Women-Only rides
                </p>
              ) : null}
            </Card>
            <SectionTitle>Notifications</SectionTitle>
            <EventFeed events={forAudience(state, `driver:${me.id}`)} limit={8} />
            <Button variant="outline" size="lg" className="mt-8" onClick={() => setDid(null)}>
              <LogOut size={18} /> Log out
            </Button>
          </div>
          {nav}
        </>
      )}
      {toastEl}
    </>
  );
}

function DriverToday({
  me,
  state,
  act,
  nav,
}: {
  me: Driver;
  state: State;
  act: ReturnType<typeof useRaahi>["act"];
  nav: React.ReactNode;
}) {
  const now = useNow(1000);
  const [reporting, setReporting] = useState(false);
  const mine = state.trips.filter(
    (t) => t.driver_id === me.id && t.date >= state.today && t.status !== "CANCELLED_REFUNDED",
  );
  const open = mine.filter((t) => t.status !== "COMPLETED");
  const next = open[0];
  const later = open.slice(1, 8);
  const doneToday = mine.filter((t) => t.date === state.today && t.status === "COMPLETED").length;
  const events = forAudience(state, `driver:${me.id}`);

  const map = next ? tripMap(next, now, `driver-${next.id}`) : <RaahiMap focus="none" />;

  return (
    <MapLayout map={map} bottomNav={nav} mapHeight="h-[38dvh]">
      <div className="flex items-center justify-between gap-3 pt-4 md:pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={me.name} />
          <div className="min-w-0">
            <p className="truncate font-extrabold">Hi {me.name.split(" ")[0]}</p>
            <p className="flex items-center gap-1 text-xs text-black/55">
              <Star size={12} className="fill-amber-400 text-amber-400" /> {stars(me.rating_sum, me.rating_count)} ·{" "}
              {doneToday} done today
            </p>
          </div>
        </div>
        <button
          onClick={() => act("toggleDuty", { driverId: me.id })}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
            me.on_duty ? "bg-brand text-ink" : "bg-ink text-white"
          }`}
        >
          <span className={`size-2.5 rounded-full ${me.on_duty ? "bg-emerald-600" : "bg-white/40"}`} />
          {me.on_duty ? "Online" : "Go online"}
        </button>
      </div>

      <div className="mt-4">
        <FreshBanner event={events[0]} />
      </div>

      <SectionTitle>Next ride</SectionTitle>
      {!next ? (
        <Empty>No rides assigned. Stay online and your operator will add you to schedules.</Empty>
      ) : (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-black/45 uppercase">{fmtDate(next.date, state.today)}</p>
              <p className="text-2xl leading-tight font-extrabold">{fmtTime(next.time)}</p>
            </div>
            <TripStatusChip status={next.status} />
          </div>
          <p className="mt-2 text-sm">
            Passenger: <b>{passengerFirstName(next, state)}</b>
          </p>
          <div className="mt-3">
            <RouteLines from={next.from_label} to={next.to_label} />
          </div>
          <div className="mt-3">
            <CategoryChip category={next.category} />
          </div>

          {NEXT_ACTION[next.status] && !reporting && (
            <div className="mt-4 grid gap-2">
              <Button variant="lime" size="lg" onClick={() => act("tripProgress", { tripId: next.id, driverId: me.id })}>
                <Navigation size={18} /> {NEXT_ACTION[next.status]}
              </Button>
              {(next.status === "CONFIRMED" || next.status === "DRIVER_EN_ROUTE") && (
                <Button variant="ghost" onClick={() => setReporting(true)}>
                  <CircleOff size={16} /> I can’t make this ride
                </Button>
              )}
            </div>
          )}

          {reporting && (
            <div className="animate-rise mt-4 rounded-2xl bg-amber-50 p-3">
              <p className="text-sm font-semibold">What happened? We’ll send a verified backup right away.</p>
              <div className="mt-3 grid gap-2">
                {REASONS.map((r) => (
                  <Button
                    key={r}
                    onClick={async () => {
                      await act("driverUnavailable", { tripId: next.id, driverId: me.id, reason: r });
                      setReporting(false);
                    }}
                  >
                    {r}
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => setReporting(false)}>
                  Never mind
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {later.length > 0 && (
        <>
          <SectionTitle>Later</SectionTitle>
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
            {later.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wider text-black/45 uppercase">{fmtDate(t.date, state.today)}</p>
                  <p className="font-bold">
                    {fmtTime(t.time)} · {passengerFirstName(t, state)}
                  </p>
                  <p className="truncate text-xs text-black/50">
                    {t.from_label} → {t.to_label}
                  </p>
                </div>
                {t.category === "WOMEN_ONLY" ? <CategoryChip category={t.category} /> : <TripStatusChip status={t.status} />}
              </div>
            ))}
          </div>
        </>
      )}
    </MapLayout>
  );
}

// Drivers only ever see the passenger's first name.
function passengerFirstName(t: Trip, state: State) {
  const plan = state.plans.find((p) => p.id === t.plan_id);
  return state.passengers.find((p) => p.id === plan?.passenger_id)?.name.split(" ")[0] ?? "Passenger";
}
