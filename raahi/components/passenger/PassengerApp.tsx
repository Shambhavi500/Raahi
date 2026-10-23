"use client";

import { useState } from "react";
import { ChevronRight, Home, ListChecks, LogOut, Search, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { useNow, useRaahi, useSession } from "@/lib/client";
import { CITY_CENTER, PLACES, rupees, type Loc, type Passenger, type State } from "@/lib/shared";
import RaahiMap from "../map/RaahiMap";
import {
  Avatar,
  BottomNav,
  Button,
  Card,
  FreshBanner,
  MapLayout,
  SectionTitle,
  Splash,
  Toast,
  forAudience,
  greeting,
} from "../ui";
import { BookingFlow, KIND_ICON } from "./Booking";
import { PassengerOnboarding } from "./Onboarding";
import { LIVE, PlanView, RideCard, RidesTab, TripView, planMap, tripMap } from "./Rides";

type Tab = "home" | "rides" | "account";
type View =
  | { name: "tabs"; tab: Tab }
  | { name: "book"; dropoff?: Loc | null }
  | { name: "plan"; planId: number; from?: Tab }
  | { name: "trip"; tripId: number; from?: Tab };

export default function PassengerApp() {
  const { state, act, toast, setToast } = useRaahi();
  const [pid, setPid, ready] = useSession("passenger");
  const [view, setView] = useState<View>({ name: "tabs", tab: "home" });

  if (!ready || !state) return <Splash />;
  const me = pid ? state.passengers.find((p) => p.id === pid) : undefined;
  const toastEl = <Toast message={toast} onClose={() => setToast(null)} />;

  if (!me) {
    return (
      <>
        <PassengerOnboarding
          act={act}
          onDone={(id) => {
            setPid(id);
            setView({ name: "tabs", tab: "home" });
          }}
        />
        {toastEl}
      </>
    );
  }

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };
  const home = () => go({ name: "tabs", tab: "home" });

  let screen: React.ReactNode;
  if (view.name === "book") {
    screen = (
      <BookingFlow
        me={me}
        act={act}
        initialDropoff={view.dropoff}
        onClose={home}
        onRequested={(planId) => go({ name: "plan", planId })}
      />
    );
  } else if (view.name === "plan") {
    const plan = state.plans.find((p) => p.id === view.planId);
    screen = plan ? (
      <PlanView
        plan={plan}
        state={state}
        me={me}
        act={act}
        onBack={() => go({ name: "tabs", tab: view.from ?? "home" })}
        onOpenTrip={(tripId) => go({ name: "trip", tripId, from: view.from })}
        onBookAgain={() => go({ name: "book" })}
      />
    ) : null;
  } else if (view.name === "trip") {
    const trip = state.trips.find((t) => t.id === view.tripId);
    const back = () => go({ name: "tabs", tab: view.from ?? "home" });
    screen = trip ? <TripView trip={trip} state={state} me={me} act={act} onBack={back} /> : null;
  } else {
    const nav = (
      <BottomNav
        items={[
          { id: "home" as Tab, label: "Home", icon: Home },
          { id: "rides" as Tab, label: "Rides", icon: ListChecks },
          { id: "account" as Tab, label: "Account", icon: UserRound },
        ]}
        value={view.tab}
        onChange={(tab) => go({ name: "tabs", tab })}
      />
    );
    screen =
      view.tab === "home" ? (
        <HomeTab me={me} state={state} nav={nav} go={go} />
      ) : (
        <>
          {view.tab === "rides" ? (
            <RidesTab
              me={me}
              state={state}
              onOpenTrip={(tripId) => go({ name: "trip", tripId, from: "rides" })}
              onOpenPlan={(planId) => go({ name: "plan", planId, from: "rides" })}
            />
          ) : (
            <AccountTab me={me} act={act} onLogout={() => setPid(null)} />
          )}
          {nav}
        </>
      );
  }

  return (
    <>
      {screen ?? <Splash />}
      {toastEl}
    </>
  );
}

// ---------- home ----------

function HomeTab({ me, state, nav, go }: { me: Passenger; state: State; nav: React.ReactNode; go: (v: View) => void }) {
  const now = useNow(1000);
  const plans = state.plans.filter((p) => p.passenger_id === me.id);
  const planIds = new Set(plans.map((p) => p.id));
  const trips = state.trips.filter(
    (t) => planIds.has(t.plan_id) && t.date >= state.today && t.status !== "CANCELLED_REFUNDED",
  );
  const live = trips.find((t) => LIVE.includes(t.status));
  const needsYou = trips.find((t) => t.status === "NO_ELIGIBLE_DRIVER" || t.status === "REPLACEMENT_SEARCHING");
  const next = live ?? needsYou ?? trips.find((t) => t.status !== "COMPLETED");
  const pending = plans.find((p) => p.status === "PENDING_OPERATOR_CONFIRMATION" || p.status === "PENDING_PAYMENT");
  const events = forAudience(state, `passenger:${me.id}`);
  const quick = PLACES.filter((p) => p.kind === "college" || p.kind === "office").slice(0, 6);

  const map = next
    ? tripMap(next, now, `home-trip-${next.id}`)
    : pending
      ? planMap(pending)
      : <RaahiMap markers={[{ ...CITY_CENTER, kind: "dot" }]} focus="city" />;

  return (
    <MapLayout map={map} bottomNav={nav} mapHeight="h-[40dvh]">
      <div className="flex items-center justify-between gap-3 pt-4 md:pt-6">
        <div className="min-w-0">
          <p className="text-sm text-black/50">{greeting()},</p>
          <h1 className="truncate text-2xl font-extrabold">{me.name.split(" ")[0]}</h1>
        </div>
        {me.credit > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold">
            <Wallet size={14} /> {rupees(me.credit)}
          </span>
        )}
      </div>

      <div className="mt-4">
        <FreshBanner event={events[0]} />
      </div>

      {next && (
        <>
          <SectionTitle>{live ? "Happening now" : needsYou ? "Needs attention" : "Your next ride"}</SectionTitle>
          <RideCard trip={next} state={state} onClick={() => go({ name: "trip", tripId: next.id })} />
        </>
      )}

      {pending && (
        <>
          <SectionTitle>Your plan</SectionTitle>
          <Card onClick={() => go({ name: "plan", planId: pending.id })} className="!border-amber-300">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {pending.status === "PENDING_PAYMENT" ? "Confirmed! Pay to start your rides" : "Waiting for an operator to confirm"}
                </p>
                <p className="truncate text-sm text-black/55">
                  {pending.pickup_label} → {pending.dropoff_label}
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-black/40" />
            </div>
          </Card>
        </>
      )}

      <button
        onClick={() => go({ name: "book" })}
        className="mt-5 flex w-full items-center gap-3 rounded-full bg-white px-5 py-4 text-left shadow-sm ring-1 ring-black/10 transition hover:ring-black/25"
      >
        <Search size={20} />
        <span className="min-w-0 flex-1 truncate text-base font-bold sm:text-lg">
          {plans.length ? "Plan another commute" : "Where do you go every day?"}
        </span>
        <ChevronRight size={20} className="text-black/40" />
      </button>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        {quick.map((p) => {
          const Icon = KIND_ICON[p.kind];
          return (
            <button
              key={p.id}
              onClick={() => go({ name: "book", dropoff: { label: p.label, lat: p.lat, lng: p.lng } })}
              className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold ring-1 ring-black/10"
            >
              <Icon size={15} /> {p.label}
            </button>
          );
        })}
      </div>

      {!plans.length && (
        <>
          <SectionTitle>How Raahi works</SectionTitle>
          <div className="grid gap-2">
            {[
              ["1", "Book once", "Set your route, days and time. Get a monthly price upfront."],
              ["2", "We confirm a driver", "A verified fleet confirms they have room for every ride."],
              ["3", "Never stranded", "If your driver can’t come, a verified backup is sent automatically."],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">{n}</span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="text-sm text-black/55">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </MapLayout>
  );
}

// ---------- account ----------

const GENDER_LABEL = { F: "Woman", M: "Man", X: "Non-binary", U: "Prefer not to say" } as const;

function AccountTab({ me, act, onLogout }: { me: Passenger; act: ReturnType<typeof useRaahi>["act"]; onLogout: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar name={me.name} className="size-16 text-lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{me.name}</h1>
          <p className="text-sm text-black/55">
            +91 {me.phone.slice(0, 5)} {me.phone.slice(5)}
          </p>
        </div>
      </div>

      <SectionTitle>Profile</SectionTitle>
      <div className="divide-y divide-black/5 rounded-3xl border border-black/10 bg-white">
        <Row label="Age" value={`${me.age} years`} />
        <Row label="Gender" value={GENDER_LABEL[me.gender]} note="Only used for Women-Only eligibility" />
        <Row label="Raahi credit" value={rupees(me.credit)} />
      </div>

      {me.gender === "F" && (
        <>
          <SectionTitle>Women-Only rides</SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fuchsia-100 text-fuchsia-800">
                <ShieldCheck size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{me.women_verified ? "You’re verified" : "Not verified yet"}</p>
                <p className="text-xs text-black/55">
                  {me.women_verified ? "You can book Women-Only plans." : "Verify once to book Women-Only plans."}
                </p>
              </div>
              {!me.women_verified && (
                <Button variant="lime" size="sm" onClick={() => act("verifyWomen", { passengerId: me.id })}>
                  Verify (demo)
                </Button>
              )}
            </div>
          </Card>
        </>
      )}

      <SectionTitle>Your safety</SectionTitle>
      <ul className="space-y-2 text-sm text-black/65">
        <li>• Drivers only see your first name and pickup point.</li>
        <li>• Calls go through a private number.</li>
        <li>• Safety help during every ride. In an emergency, dial 112.</li>
      </ul>

      <Button variant="outline" size="lg" className="mt-8" onClick={onLogout}>
        <LogOut size={18} /> Log out
      </Button>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-black/55">{label}</p>
        {note && <p className="text-[11px] text-black/40">{note}</p>}
      </div>
      <p className="shrink-0 font-semibold">{value}</p>
    </div>
  );
}
