"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Car,
  Check,
  GraduationCap,
  Home,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  TrainFront,
} from "lucide-react";
import type { Act } from "@/lib/client";
import {
  DAY_LABELS,
  DURATIONS,
  PLACES,
  distanceKm,
  nearestPlace,
  quote,
  rupees,
  type Category,
  type Duration,
  type Loc,
  type Passenger,
  type PlaceKind,
} from "@/lib/shared";
import RaahiMap, { type MapMarker } from "../map/RaahiMap";
import { Button, MapLayout, StepHeading, TopBar, fmtTime } from "../ui";

type Step = "route" | "schedule" | "ride" | "review";
const STEPS: Step[] = ["route", "schedule", "ride", "review"];

export interface Draft {
  pickup: Loc | null;
  dropoff: Loc | null;
  days: number[];
  pickupTime: string;
  hasReturn: boolean;
  returnTime: string;
  category: Category;
  duration: Duration;
}

export const KIND_ICON: Record<PlaceKind, typeof Home> = {
  home: Home,
  college: GraduationCap,
  office: Building2,
  transit: TrainFront,
};

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Mon – Sat", days: [1, 2, 3, 4, 5, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
];

export function BookingFlow({
  me,
  act,
  initialDropoff,
  onClose,
  onRequested,
}: {
  me: Passenger;
  act: Act;
  initialDropoff?: Loc | null;
  onClose: () => void;
  onRequested: (planId: number) => void;
}) {
  const [step, setStep] = useState<Step>("route");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    pickup: null,
    dropoff: initialDropoff ?? null,
    days: [1, 2, 3, 4, 5],
    pickupTime: "08:30",
    hasReturn: true,
    returnTime: "17:30",
    category: me.women_verified ? "WOMEN_ONLY" : "STANDARD",
    duration: "MONTHLY",
  });
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const idx = STEPS.indexOf(step);
  const back = () => (idx === 0 ? onClose() : setStep(STEPS[idx - 1]));
  const next = () => setStep(STEPS[idx + 1]);
  const q =
    draft.pickup && draft.dropoff
      ? quote({ pickup: draft.pickup, dropoff: draft.dropoff, days: draft.days, hasReturn: draft.hasReturn, duration: draft.duration })
      : null;

  const request = async () => {
    setBusy(true);
    const r = await act<{ planId: number }>("createPlan", {
      passengerId: me.id,
      pickup: draft.pickup,
      dropoff: draft.dropoff,
      days: draft.days,
      pickupTime: draft.pickupTime,
      returnTime: draft.hasReturn ? draft.returnTime : null,
      category: draft.category,
      duration: draft.duration,
    });
    setBusy(false);
    if (r.ok && r.data) onRequested(r.data.planId);
  };

  const top = <TopBar onBack={back} step={idx + 1} total={STEPS.length} />;

  if (step === "route") return <RouteStep draft={draft} set={set} top={top} onNext={next} />;

  const routeMap = (
    <RaahiMap
      route={draft.pickup && draft.dropoff ? { from: draft.pickup, to: draft.dropoff } : null}
      markers={[
        ...(draft.pickup ? [{ ...draft.pickup, kind: "pickup" as const }] : []),
        ...(draft.dropoff ? [{ ...draft.dropoff, kind: "drop" as const }] : []),
      ]}
      focus={`${draft.pickup?.label}-${draft.dropoff?.label}`}
    />
  );

  if (step === "schedule") {
    return (
      <MapLayout
        map={routeMap}
        mapHeight="h-[30dvh]"
        footer={
          <Button size="lg" disabled={!draft.days.length} onClick={next}>
            Next <ArrowRight size={18} />
          </Button>
        }
      >
        {top}
        <StepHeading title="When do you travel?" subtitle="Pick your days and times once. We repeat them every week." />

        <p className="text-sm font-semibold">Days</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = p.days.join() === draft.days.join();
            return (
              <button
                key={p.label}
                onClick={() => set({ days: p.days })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-ink bg-ink text-white" : "border-black/15 bg-white"}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((label, d) => {
            const on = draft.days.includes(d);
            return (
              <button
                key={label}
                onClick={() => set({ days: on ? draft.days.filter((x) => x !== d) : [...draft.days, d].sort() })}
                aria-pressed={on}
                className={`aspect-square rounded-2xl text-xs font-bold transition ${on ? "bg-ink text-brand" : "bg-white text-black/50 ring-1 ring-black/10"}`}
              >
                {label.slice(0, 2)}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3">
          <TimeCard label="Pick me up at" value={draft.pickupTime} onChange={(v) => set({ pickupTime: v })} />
          <div className="rounded-3xl border border-black/10 bg-white p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Also book my ride back</span>
                <span className="text-xs text-black/50">
                  {draft.dropoff?.label ?? "Drop"} → {draft.pickup?.label ?? "Pickup"}
                </span>
              </span>
              <Switch on={draft.hasReturn} onChange={(v) => set({ hasReturn: v })} />
            </label>
            {draft.hasReturn && (
              <input
                type="time"
                value={draft.returnTime}
                onChange={(e) => set({ returnTime: e.target.value })}
                className="mt-3 w-full rounded-2xl bg-canvas px-4 py-3 text-xl font-bold outline-none"
              />
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-black/45">Your driver waits up to 5 minutes for free at pickup.</p>
      </MapLayout>
    );
  }

  if (step === "ride" && q) {
    return (
      <MapLayout
        map={routeMap}
        mapHeight="h-[30dvh]"
        footer={
          <Button size="lg" onClick={next} disabled={draft.category === "WOMEN_ONLY" && !me.women_verified}>
            Choose {draft.category === "WOMEN_ONLY" ? "Women-Only" : "Standard"} <ArrowRight size={18} />
          </Button>
        }
      >
        {top}
        <StepHeading title="Choose your ride" subtitle={`${q.km} km · about ${q.tripsPerMonth} rides a month`} />

        <div className="grid gap-2">
          <RideOption
            selected={draft.category === "STANDARD"}
            onSelect={() => set({ category: "STANDARD" })}
            icon={Car}
            title="Raahi Standard"
            lines={["Verified driver · auto or cab", "Backup driver included"]}
            price={q.monthly}
          />
          <RideOption
            selected={draft.category === "WOMEN_ONLY"}
            onSelect={() => set({ category: "WOMEN_ONLY" })}
            icon={ShieldCheck}
            title="Raahi Women-Only"
            lines={["Verified women drivers only", "Never switched without your say"]}
            price={q.monthly}
            locked={!me.women_verified}
            lockedText={me.gender === "F" ? "Verify in Account to unlock" : "For verified women riders"}
            accent
          />
        </div>

        <p className="mt-6 text-sm font-semibold">Plan length</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(DURATIONS) as Duration[]).map((d) => (
            <button
              key={d}
              onClick={() => set({ duration: d })}
              className={`rounded-2xl border-2 px-2 py-3 text-center transition ${
                draft.duration === d ? "border-ink bg-white" : "border-transparent bg-white/60"
              }`}
            >
              <span className="block text-sm font-bold">{DURATIONS[d].label}</span>
              <span className="block text-[11px] text-black/50">{DURATIONS[d].short}</span>
              {DURATIONS[d].discount > 0 && (
                <span className="mt-1 inline-block rounded-full bg-brand px-2 text-[10px] font-bold">
                  −{Math.round(DURATIONS[d].discount * 100)}%
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
          About <b>{rupees(Math.round(q.monthly / Math.max(q.tripsPerMonth, 1)))}</b> per ride. You save{" "}
          <b>{rupees(q.saved)}</b> a month vs booking every day.
        </div>
      </MapLayout>
    );
  }

  // Review
  return (
    <MapLayout
      map={routeMap}
      mapHeight="h-[30dvh]"
      footer={
        <>
          <Button variant="lime" size="lg" disabled={busy || !q} onClick={request}>
            {busy ? "Sending request…" : `Request plan · ${q ? rupees(q.monthly) : ""}/month`}
          </Button>
          <p className="mt-2 text-center text-xs text-black/45">You pay only after an operator confirms.</p>
        </>
      }
    >
      {top}
      <StepHeading title="Review your plan" />
      <div className="divide-y divide-black/5 rounded-3xl border border-black/10 bg-white">
        <ReviewRow label="Route" edit={() => setStep("route")}>
          <RouteLines from={draft.pickup!.label} to={draft.dropoff!.label} />
          <span className="text-xs text-black/50">{q?.km} km</span>
        </ReviewRow>
        <ReviewRow label="Schedule" edit={() => setStep("schedule")}>
          <span className="font-semibold">{draft.days.map((d) => DAY_LABELS[d]).join(", ")}</span>
          <span className="block text-sm text-black/60">
            Pickup {fmtTime(draft.pickupTime)}
            {draft.hasReturn ? ` · Return ${fmtTime(draft.returnTime)}` : " · One way"}
          </span>
        </ReviewRow>
        <ReviewRow label="Ride" edit={() => setStep("ride")}>
          <span className="font-semibold">Raahi {draft.category === "WOMEN_ONLY" ? "Women-Only" : "Standard"}</span>
          <span className="block text-sm text-black/60">
            {DURATIONS[draft.duration].label} plan · {q && rupees(q.monthly)}/month
            {DURATIONS[draft.duration].months > 1 && q ? ` · ${rupees(q.total)} total` : ""}
          </span>
        </ReviewRow>
      </div>

      <p className="mt-6 text-sm font-semibold">What happens next</p>
      <ol className="mt-3 space-y-3">
        {[
          "A nearby fleet operator checks they have room for every ride",
          "You pay, only after they confirm",
          "A verified driver is set for every ride",
          "If your driver can’t come, a verified backup is sent automatically",
        ].map((t, i) => (
          <li key={t} className="flex gap-3 text-sm">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-brand">{i + 1}</span>
            <span className="pt-0.5 text-black/70">{t}</span>
          </li>
        ))}
      </ol>
    </MapLayout>
  );
}

// ---------- step 1: where ----------

function RouteStep({
  draft,
  set,
  top,
  onNext,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  top: React.ReactNode;
  onNext: () => void;
}) {
  // Which box is being edited; null once both are set.
  const [field, setField] = useState<"pickup" | "dropoff" | null>(
    !draft.pickup ? "pickup" : !draft.dropoff ? "dropoff" : null,
  );
  const [query, setQuery] = useState("");
  const [pinMode, setPinMode] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);

  const other = field === "pickup" ? draft.dropoff : draft.pickup;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Pickups are usually homes; drops are usually colleges and offices.
    const order: PlaceKind[] = field === "pickup" ? ["home", "transit", "college", "office"] : ["college", "office", "transit", "home"];
    return PLACES.filter((p) => p.label !== other?.label)
      .filter((p) => !q || p.label.toLowerCase().includes(q) || p.area.toLowerCase().includes(q))
      .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  }, [query, other, field]);

  const choose = (loc: Loc) => {
    if (!field) return;
    const patch = { [field]: loc } as Partial<Draft>;
    set(patch);
    setQuery("");
    setPinMode(false);
    const after = { ...draft, ...patch };
    setField(!after.pickup ? "pickup" : !after.dropoff ? "dropoff" : null);
  };

  const pinLabel = (c: { lat: number; lng: number }) => {
    const near = nearestPlace(c);
    return distanceKm(c, near) < 2.5 ? `Pinned spot near ${near.label}` : "Pinned spot";
  };

  const both = draft.pickup && draft.dropoff;
  const km = both ? distanceKm(draft.pickup!, draft.dropoff!) : 0;
  const tooClose = both && km < 1;

  const markers: MapMarker[] = [
    ...(draft.pickup && !(pinMode && field === "pickup") ? [{ ...draft.pickup, kind: "pickup" as const }] : []),
    ...(draft.dropoff && !(pinMode && field === "dropoff") ? [{ ...draft.dropoff, kind: "drop" as const }] : []),
  ];

  return (
    <MapLayout
      map={
        <RaahiMap
          route={both && !pinMode ? { from: draft.pickup!, to: draft.dropoff! } : null}
          markers={markers}
          pinMode={pinMode}
          onCenterChange={setCenter}
          focus={`${draft.pickup?.label}-${draft.dropoff?.label}-${pinMode}`}
        />
      }
      footer={
        pinMode ? (
          <Button size="lg" disabled={!center} onClick={() => center && choose({ label: pinLabel(center), ...center })}>
            <Check size={18} /> Use this spot as {field === "pickup" ? "pickup" : "drop"}
          </Button>
        ) : both ? (
          <Button size="lg" disabled={!!tooClose} onClick={onNext}>
            {tooClose ? "Pickup and drop are too close" : <>Next · {km} km <ArrowRight size={18} /></>}
          </Button>
        ) : null
      }
    >
      {top}
      <StepHeading title="Where do you go every day?" subtitle="Set it once. We’ll repeat this ride for you." />

      {/* Uber-style pickup / drop box */}
      <div className="flex gap-3 rounded-3xl border border-black/10 bg-white p-3">
        <div className="flex flex-col items-center pt-4">
          <span className="size-3 rounded-full border-[3px] border-ink bg-brand" />
          <span className="my-1 w-0.5 flex-1 bg-black/15" />
          <span className="mb-4 size-3 rounded-[3px] bg-ink" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {(["pickup", "dropoff"] as const).map((f) => {
            const active = field === f;
            const value = draft[f];
            return (
              <div
                key={f}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${active ? "bg-canvas ring-2 ring-ink" : "bg-canvas/60"}`}
              >
                <Search size={16} className="shrink-0 text-black/40" />
                <input
                  value={active ? query : (value?.label ?? "")}
                  placeholder={f === "pickup" ? "Pickup: home, hostel…" : "Drop: college, office…"}
                  onFocus={() => {
                    setField(f);
                    setQuery("");
                    setPinMode(false);
                  }}
                  onChange={(e) => {
                    setField(f);
                    setQuery(e.target.value);
                  }}
                  className="w-full min-w-0 bg-transparent py-1 text-base font-semibold outline-none placeholder:font-normal placeholder:text-black/40 sm:text-sm"
                  aria-label={f === "pickup" ? "Pickup location" : "Drop location"}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!pinMode && field && (
        <ul className="mt-3 overflow-hidden rounded-3xl border border-black/10 bg-white">
          <li>
            <button
              onClick={() => {
                setPinMode(true);
                setCenter(null);
              }}
              className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left hover:bg-black/[0.03]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand">
                <MapPin size={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">Set {field === "pickup" ? "pickup" : "drop"} on the map</span>
                <span className="block text-xs text-black/50">Move the map to your exact gate</span>
              </span>
            </button>
          </li>
          {results.map((p) => {
            const Icon = KIND_ICON[p.kind];
            return (
              <li key={p.id}>
                <button
                  onClick={() => choose({ label: p.label, lat: p.lat, lng: p.lng })}
                  className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-black/[0.03]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/5">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.label}</span>
                    <span className="block truncate text-xs text-black/50">{p.area}</span>
                  </span>
                  {other && <span className="shrink-0 text-xs text-black/40">{distanceKm(other, p)} km</span>}
                </button>
              </li>
            );
          })}
          {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-black/50">No match. Try setting it on the map.</li>}
        </ul>
      )}

      {!pinMode && !field && (
        <p className="mt-3 px-1 text-sm text-black/50">Looks good! Tap either box to change it.</p>
      )}

      {pinMode && (
        <div className="mt-3 rounded-3xl border border-black/10 bg-white p-4">
          <p className="text-xs font-bold tracking-wider text-black/45 uppercase">
            {field === "pickup" ? "Pickup" : "Drop"} spot
          </p>
          <p className="mt-1 font-semibold">{center ? pinLabel(center) : "Drag the map to place the pin"}</p>
          <button className="mt-2 text-sm font-semibold underline underline-offset-4" onClick={() => setPinMode(false)}>
            Search instead
          </button>
        </div>
      )}
    </MapLayout>
  );
}

// ---------- pieces ----------

function TimeCard({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-3xl border border-black/10 bg-white p-4">
      <span className="font-semibold">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-2xl bg-canvas px-4 py-3 text-xl font-bold outline-none"
      />
    </label>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-ink" : "bg-black/20"}`}
    >
      <span className={`absolute top-1 size-5 rounded-full transition-all ${on ? "left-6 bg-brand" : "left-1 bg-white"}`} />
    </button>
  );
}

function RideOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  lines,
  price,
  locked,
  lockedText,
  accent,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: typeof Car;
  title: string;
  lines: string[];
  price: number;
  locked?: boolean;
  lockedText?: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={`flex w-full items-center gap-3 rounded-3xl border-2 bg-white p-4 text-left transition disabled:opacity-55 ${
        selected && !locked ? "border-ink" : "border-transparent ring-1 ring-black/10"
      }`}
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accent ? "bg-fuchsia-100 text-fuchsia-800" : "bg-brand text-ink"}`}
      >
        <Icon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        {locked ? (
          <span className="flex items-center gap-1 text-xs text-black/55">
            <Lock size={12} /> {lockedText}
          </span>
        ) : (
          lines.map((l) => (
            <span key={l} className="block text-xs text-black/55">
              {l}
            </span>
          ))
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-extrabold">{rupees(price)}</span>
        <span className="block text-[11px] text-black/45">/month</span>
      </span>
    </button>
  );
}

function ReviewRow({ label, edit, children }: { label: string; edit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[11px] font-bold tracking-wider text-black/45 uppercase">{label}</p>
        {children}
      </div>
      <button onClick={edit} className="shrink-0 text-sm font-semibold underline underline-offset-4">
        Edit
      </button>
    </div>
  );
}

export function RouteLines({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className="size-2.5 rounded-full border-2 border-ink bg-brand" />
        <span className="my-0.5 w-0.5 flex-1 bg-black/15" />
        <span className="mb-1.5 size-2.5 rounded-[2px] bg-ink" />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="truncate font-semibold">{from}</p>
        <p className="truncate font-semibold">{to}</p>
      </div>
    </div>
  );
}
