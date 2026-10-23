import type { SQLInputValue } from "node:sqlite";
import { db, dropAll } from "./db";
import {
  DAY_LABELS,
  OPERATOR_PHONE,
  quote,
  rupees,
  type Category,
  type Driver,
  type Duration,
  type EventKind,
  type Gender,
  type Loc,
  type Passenger,
  type Plan,
  type Role,
  type State,
  type Trip,
  type TripStatus,
} from "./shared";

// ---------- tiny query helpers ----------

const g = globalThis as unknown as {
  __raahiSeeded?: boolean;
  __raahiOtps?: Map<string, { code: string; expires: number }>;
  __raahiVerifiedPhones?: Set<string>;
};
const otps = (g.__raahiOtps ??= new Map());
const verifiedPhones = (g.__raahiVerifiedPhones ??= new Set());

function conn() {
  const d = db();
  if (!g.__raahiSeeded) {
    g.__raahiSeeded = true;
    const { n } = d.prepare("SELECT COUNT(*) AS n FROM drivers").get() as { n: number };
    if (n === 0) seed();
  }
  return d;
}

function one<T>(sql: string, ...p: SQLInputValue[]): T | undefined {
  return conn().prepare(sql).get(...p) as unknown as T | undefined;
}
function many<T>(sql: string, ...p: SQLInputValue[]): T[] {
  return conn().prepare(sql).all(...p) as unknown as T[];
}
function run(sql: string, ...p: SQLInputValue[]) {
  return conn().prepare(sql).run(...p);
}

class UserError extends Error {}
const fail = (msg: string): never => {
  throw new UserError(msg);
};

function getTrip(id: number) {
  return one<Trip>("SELECT * FROM trips WHERE id = ?", id) ?? fail("Trip not found");
}
function getPlan(id: number) {
  return one<Plan>("SELECT * FROM plans WHERE id = ?", id) ?? fail("Plan not found");
}
function getDriver(id: number) {
  return one<Driver>("SELECT * FROM drivers WHERE id = ?", id) ?? fail("Driver not found");
}
function getPassenger(id: number) {
  return one<Passenger>("SELECT * FROM passengers WHERE id = ?", id) ?? fail("Passenger not found");
}

// Audience keys: "operator", "passenger:<id>", "driver:<id>".
function log(
  audience: string[],
  kind: EventKind,
  title: string,
  detail = "",
  ids: { tripId?: number; planId?: number } = {},
) {
  run(
    "INSERT INTO events (ts, audience, kind, title, detail, trip_id, plan_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    now(),
    `,${audience.join(",")},`,
    kind,
    title,
    detail,
    ids.tripId ?? null,
    ids.planId ?? null,
  );
}

const now = () => new Date().toISOString();
const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const tripLabel = (t: Trip) =>
  `${DAY_LABELS[new Date(t.date + "T00:00").getDay()]} ${t.time} · ${t.from_label} → ${t.to_label}`;
const firstName = (name: string) => name.split(" ")[0];
const unavailableIds = (t: Trip) => t.unavailable_ids.split(",").filter(Boolean).map(Number);

const CLOSED_STATUSES = "('CANCELLED_REFUNDED')";

function setStatus(tripId: number, status: TripStatus) {
  run("UPDATE trips SET status = ?, status_at = ? WHERE id = ?", status, now(), tripId);
}

// ---------- login (demo OTP) ----------

function normalisePhone(phone: unknown) {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) fail("Enter a valid 10-digit mobile number.");
  return digits;
}

function requestOtp(a: { phone: string; role: Role }) {
  const phone = normalisePhone(a.phone);
  if (a.role === "driver" && !one("SELECT id FROM drivers WHERE phone = ?", phone)) {
    fail("This number isn't registered as a Raahi driver. Ask your fleet operator to add you.");
  }
  if (a.role === "operator" && phone !== OPERATOR_PHONE) fail("This number doesn't have operator access.");
  const code = String(Math.floor(1000 + Math.random() * 9000));
  otps.set(`${a.role}:${phone}`, { code, expires: Date.now() + 5 * 60_000 });
  // Demo: the code comes back to the screen instead of going out by SMS.
  return { phone, code };
}

function verifyOtp(a: { phone: string; role: Role; code: string }) {
  const phone = normalisePhone(a.phone);
  const key = `${a.role}:${phone}`;
  const entry = otps.get(key);
  if (!entry || entry.expires < Date.now()) fail("That code has expired. Tap 'Resend code'.");
  if (entry!.code !== String(a.code).trim()) fail("That code doesn't match. Please try again.");
  otps.delete(key);
  if (a.role === "passenger") {
    verifiedPhones.add(phone);
    const p = one<{ id: number }>("SELECT id FROM passengers WHERE phone = ?", phone);
    return { phone, id: p?.id ?? null };
  }
  if (a.role === "driver") {
    return { phone, id: one<{ id: number }>("SELECT id FROM drivers WHERE phone = ?", phone)!.id };
  }
  return { phone, id: 1 };
}

function registerPassenger(a: { phone: string; name: string; age: number; gender: Gender }) {
  const phone = normalisePhone(a.phone);
  if (!verifiedPhones.has(phone)) fail("Please verify your phone number first.");
  if (one("SELECT id FROM passengers WHERE phone = ?", phone)) fail("An account with this number already exists.");
  const name = String(a.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) fail("Please enter your name (2–40 letters).");
  const age = Math.floor(Number(a.age));
  if (!Number.isFinite(age) || age < 18 || age > 100) fail("Raahi is for riders aged 18 and above for now.");
  if (!["F", "M", "X", "U"].includes(a.gender)) fail("Please choose an option.");
  const res = run("INSERT INTO passengers (phone, name, age, gender) VALUES (?, ?, ?, ?)", phone, name, age, a.gender);
  const id = Number(res.lastInsertRowid);
  verifiedPhones.delete(phone);
  log([`passenger:${id}`], "success", `Welcome to Raahi, ${firstName(name)}!`, "Set up your daily commute once and we handle the rest.");
  log(["operator"], "info", `New passenger signed up: ${name}`);
  return { id };
}

function verifyWomen(a: { passengerId: number }) {
  const p = getPassenger(a.passengerId);
  if (p.gender !== "F") fail("Women-Only verification is available for women riders.");
  run("UPDATE passengers SET women_verified = 1 WHERE id = ?", p.id);
  log([`passenger:${p.id}`], "success", "You're verified for Women-Only rides", "Women-Only rides use verified women drivers only.");
}

// ---------- dispatch core ----------

// Returns why a driver can't take this trip, or null if they're eligible.
// A driver failing any rule is excluded, never ranked lower.
function exclusionReason(driver: Driver, trip: Trip): string | null {
  if (unavailableIds(trip).includes(driver.id)) return "reported unavailable for this trip";
  if (!driver.on_duty) return "off duty";
  if (trip.category === "WOMEN_ONLY" && !driver.women_only_eligible) return "not Women-Only eligible";
  const sameDay = many<{ time: string }>(
    `SELECT time FROM trips WHERE driver_id = ? AND date = ? AND id <> ? AND status NOT IN ${CLOSED_STATUSES}`,
    driver.id,
    trip.date,
    trip.id,
  );
  if (sameDay.some((r) => Math.abs(minutes(r.time) - minutes(trip.time)) < 60)) {
    return "already booked at this time";
  }
  return null;
}

function dispatch(tripId: number, preferredId: number | null) {
  const trip = getTrip(tripId);
  const load = (d: Driver) =>
    one<{ n: number }>("SELECT COUNT(*) AS n FROM trips WHERE driver_id = ? AND date = ?", d.id, trip.date)!.n;
  const drivers = many<Driver>("SELECT * FROM drivers").sort((a, b) => {
    if (a.id === preferredId) return -1;
    if (b.id === preferredId) return 1;
    return load(a) - load(b);
  });

  // Check every driver so the audit log shows exactly who was excluded and why.
  const checked = drivers.map((d) => ({ d, reason: exclusionReason(d, trip) }));
  const skipped = checked.filter((c) => c.reason).map((c) => `${c.d.name} (${c.reason})`);
  for (const { d } of checked.filter((c) => !c.reason)) {
    try {
      // The UNIQUE(driver_id, date, time) constraint is the last guard against double-booking.
      const res = run(
        "UPDATE trips SET driver_id = ?, status = 'CONFIRMED', status_at = ? WHERE id = ? AND driver_id IS NULL",
        d.id,
        now(),
        trip.id,
      );
      if (res.changes === 1) return { driver: d, skipped };
    } catch {
      skipped.push(`${d.name} (double-booking blocked)`);
    }
  }
  setStatus(trip.id, "NO_ELIGIBLE_DRIVER");
  return { driver: null, skipped };
}

// Run a step a moment later (used for the visible "searching" state). Never let it crash the server.
function later(fn: () => void, ms: number) {
  setTimeout(() => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  }, ms);
}

function passengerOf(trip: Trip) {
  return getPassenger(getPlan(trip.plan_id).passenger_id);
}

function runReplacement(tripId: number) {
  const trip = getTrip(tripId);
  if (!["REPLACEMENT_SEARCHING", "NO_ELIGIBLE_DRIVER", "ASSIGNMENT_PENDING"].includes(trip.status)) return;
  const p = passengerOf(trip);
  const { driver, skipped } = dispatch(tripId, null);
  const checked = skipped.length ? `Skipped: ${skipped.join(", ")}.` : "All drivers were eligible.";

  if (driver) {
    const womenNote =
      trip.category === "WOMEN_ONLY" ? " Your ride is still Women-Only, with a verified woman driver." : "";
    log([`passenger:${p.id}`], "success", `New driver confirmed: ${driver.name}`,
      `${driver.vehicle} · ${driver.plate} for ${tripLabel(trip)}.${womenNote}`, { tripId });
    log(["operator"], "success", `Trip #${tripId} covered by ${driver.name}`, checked, { tripId });
    log([`driver:${driver.id}`], "info", "New trip assigned to you",
      `${tripLabel(trip)} · Passenger: ${firstName(p.name)}`, { tripId });
  } else {
    const category = trip.category === "WOMEN_ONLY" ? "Women-Only " : "";
    log([`passenger:${p.id}`], "danger", `We couldn't find an eligible ${category}driver yet`,
      trip.category === "WOMEN_ONLY"
        ? "Your ride stays Women-Only. You can keep waiting, cancel with a refund, or switch this one ride to Standard yourself."
        : "You can keep waiting or cancel this ride with a refund.",
      { tripId });
    log(["operator"], "danger", `No eligible driver for trip #${tripId}`, `${checked} Needs dispatcher attention.`, { tripId });
  }
}

// ---------- plan actions ----------

function readLoc(l: unknown, what: string): Loc {
  const loc = l as Loc | undefined;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number" || !loc.label) fail(`Choose a ${what}.`);
  return { label: String(loc!.label).slice(0, 80), lat: loc!.lat, lng: loc!.lng };
}

function createPlan(a: {
  passengerId: number;
  pickup: Loc;
  dropoff: Loc;
  days: number[];
  pickupTime: string;
  returnTime?: string | null;
  category: Category;
  duration: Duration;
}) {
  const p = getPassenger(a.passengerId);
  const pickup = readLoc(a.pickup, "pickup point");
  const dropoff = readLoc(a.dropoff, "drop point");
  const days = [...new Set((a.days ?? []).map(Number))].filter((d) => d >= 0 && d <= 6).sort((x, y) => x - y);
  if (!days.length) fail("Pick at least one travel day.");
  if (!/^\d{2}:\d{2}$/.test(a.pickupTime)) fail("Pick a valid pickup time.");
  const q = quote({ pickup, dropoff, days, hasReturn: !!a.returnTime, duration: a.duration });
  if (q.km < 1) fail("Pickup and drop are too close together.");
  if (q.km > 45) fail("That route is outside our pilot service area.");
  if (a.category === "WOMEN_ONLY" && !p.women_verified) {
    fail("Women-Only plans need a verified woman rider account.");
  }
  const res = run(
    `INSERT INTO plans (passenger_id, pickup_label, pickup_lat, pickup_lng, dropoff_label, dropoff_lat, dropoff_lng,
       days, pickup_time, return_time, category, duration, monthly_price, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_OPERATOR_CONFIRMATION', ?)`,
    p.id, pickup.label, pickup.lat, pickup.lng, dropoff.label, dropoff.lat, dropoff.lng,
    days.join(","), a.pickupTime, a.returnTime || null, a.category, a.duration, q.monthly, now(),
  );
  const planId = Number(res.lastInsertRowid);
  const label = a.category === "WOMEN_ONLY" ? "Women-Only" : "Standard";
  log([`passenger:${p.id}`], "info", "Plan requested. Waiting for an operator to confirm",
    `${pickup.label} → ${dropoff.label} · ${label} · ${rupees(q.monthly)}/month. You won't be charged until it's confirmed.`,
    { planId });
  log(["operator"], "warning", `New ${label} plan request from ${p.name}`,
    `${pickup.label} → ${dropoff.label} · ${days.map((d) => DAY_LABELS[d]).join(", ")} at ${a.pickupTime}`,
    { planId });
  return { planId };
}

function operatorDecision(a: { planId: number; decision: "approve" | "reject"; primaryDriverId?: number }) {
  const plan = getPlan(a.planId);
  if (plan.status !== "PENDING_OPERATOR_CONFIRMATION") fail("This plan isn't waiting for a decision.");
  const p = getPassenger(plan.passenger_id);

  if (a.decision === "reject") {
    run("UPDATE plans SET status = 'REJECTED' WHERE id = ?", plan.id);
    log([`passenger:${p.id}`], "danger", "Sorry, no operator could take this plan",
      "There's no recurring capacity on this route right now. You have not been charged.", { planId: plan.id });
    log(["operator"], "info", `Plan #${plan.id} rejected`, "", { planId: plan.id });
    return;
  }

  const d = getDriver(a.primaryDriverId ?? fail("Choose a primary driver."));
  if (!d.on_duty) fail(`${d.name} is off duty.`);
  if (plan.category === "WOMEN_ONLY" && !d.women_only_eligible) {
    fail(`${d.name} is not Women-Only eligible. Women-Only plans need an eligible driver.`);
  }
  run("UPDATE plans SET status = 'PENDING_PAYMENT', primary_driver_id = ? WHERE id = ?", d.id, plan.id);
  log([`passenger:${p.id}`], "success", "Good news! Your plan is confirmed",
    `Your driver: ${d.name} (${d.vehicle}). If ${firstName(d.name)} can't come, a verified backup is sent. Pay to activate.`,
    { planId: plan.id });
  log(["operator"], "success", `Plan #${plan.id} accepted · primary ${d.name}`, "", { planId: plan.id });
}

function payPlan(a: { planId: number; passengerId: number; method?: string }) {
  const plan = getPlan(a.planId);
  if (plan.passenger_id !== a.passengerId) fail("Not your plan.");
  if (plan.status !== "PENDING_PAYMENT") fail("This plan isn't ready for payment.");
  run("UPDATE plans SET status = 'ACTIVE' WHERE id = ?", plan.id);
  const created = generateTrips(plan);
  const unassigned = created.filter((id) => getTrip(id).status !== "CONFIRMED").length;
  log([`passenger:${plan.passenger_id}`], "success", `Payment received (demo ${a.method ?? "UPI"}). You're all set!`,
    `${created.length} rides scheduled for the next 7 days.` +
      (unassigned ? ` ${unassigned} still need a driver; we'll update you.` : " Every ride has a confirmed driver."),
    { planId: plan.id });
  log(["operator"], "info", `Plan #${plan.id} active · ${created.length} trips generated`, "", { planId: plan.id });
  return { trips: created.length };
}

function generateTrips(plan: Plan): number[] {
  const days = plan.days.split(",").map(Number);
  const pickup = { label: plan.pickup_label, lat: plan.pickup_lat, lng: plan.pickup_lng };
  const dropoff = { label: plan.dropoff_label, lat: plan.dropoff_lat, lng: plan.dropoff_lng };
  const q = quote({ pickup, dropoff, days, hasReturn: !!plan.return_time, duration: plan.duration });
  const legs: { time: string; direction: Trip["direction"]; from: Loc; to: Loc }[] = [
    { time: plan.pickup_time, direction: "OUTBOUND", from: pickup, to: dropoff },
  ];
  if (plan.return_time) legs.push({ time: plan.return_time, direction: "RETURN", from: dropoff, to: pickup });

  const ids: number[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    if (!days.includes(date.getDay())) continue;
    for (const leg of legs) {
      const res = run(
        `INSERT INTO trips (plan_id, date, time, direction, from_label, from_lat, from_lng, to_label, to_lat, to_lng,
           category, fare, status, status_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNMENT_PENDING', ?)`,
        plan.id, localDate(date), leg.time, leg.direction, leg.from.label, leg.from.lat, leg.from.lng,
        leg.to.label, leg.to.lat, leg.to.lng, plan.category, q.perTrip, now(),
      );
      const id = Number(res.lastInsertRowid);
      ids.push(id);
      dispatch(id, plan.primary_driver_id);
    }
  }
  return ids;
}

// ---------- trip actions ----------

function driverUnavailable(a: { tripId: number; driverId: number; reason: string }) {
  const trip = getTrip(a.tripId);
  const d = getDriver(a.driverId);
  if (trip.driver_id !== d.id) fail("This trip isn't assigned to you.");
  if (!["CONFIRMED", "DRIVER_EN_ROUTE"].includes(trip.status)) fail("This trip can no longer be released.");
  run(
    "UPDATE trips SET driver_id = NULL, status = 'REPLACEMENT_SEARCHING', status_at = ?, unavailable_ids = unavailable_ids || ? WHERE id = ?",
    now(),
    `${d.id},`,
    trip.id,
  );
  const p = passengerOf(trip);
  log([`passenger:${p.id}`], "warning", "Your driver can't make it. Finding you a verified backup…",
    `${tripLabel(trip)}. You don't need to do anything.`, { tripId: trip.id });
  log(["operator"], "warning", `${d.name} can't do trip #${trip.id}: ${a.reason}`,
    `Auto-searching backups${trip.category === "WOMEN_ONLY" ? " (Women-Only rules apply)" : ""}…`, { tripId: trip.id });
  log([`driver:${d.id}`], "info", "You've been released from this trip", `${tripLabel(trip)} · Reason: ${a.reason}`, {
    tripId: trip.id,
  });
  // Short pause so everyone can see the "searching" state during the demo.
  later(() => runReplacement(trip.id), 3000);
}

function passengerRecovery(a: { tripId: number; passengerId: number; choice: "wait" | "cancel" | "switch_standard" }) {
  const trip = getTrip(a.tripId);
  const p = passengerOf(trip);
  if (p.id !== a.passengerId) fail("Not your ride.");
  if (trip.status !== "NO_ELIGIBLE_DRIVER") fail("This ride doesn't need a decision.");

  if (a.choice === "wait") {
    log([`passenger:${p.id}`], "info", "Okay, we'll keep looking", "You'll be notified as soon as an eligible driver is confirmed.", {
      tripId: trip.id,
    });
  } else if (a.choice === "cancel") {
    setStatus(trip.id, "CANCELLED_REFUNDED");
    run("UPDATE passengers SET credit = credit + ? WHERE id = ?", trip.fare, p.id);
    log([`passenger:${p.id}`], "info", `Ride cancelled. ${rupees(trip.fare)} added to your Raahi credit`, tripLabel(trip), {
      tripId: trip.id,
    });
    log(["operator"], "info", `Trip #${trip.id} cancelled by passenger after no eligible driver`, "Service-failure refund issued.", {
      tripId: trip.id,
    });
  } else {
    if (trip.category !== "WOMEN_ONLY") fail("This ride is already Standard.");
    run("UPDATE trips SET category = 'STANDARD', status = 'REPLACEMENT_SEARCHING', status_at = ? WHERE id = ?", now(), trip.id);
    log(["operator"], "warning", `${p.name} explicitly switched trip #${trip.id} to Standard`,
      "Category change made by the passenger (audit record).", { tripId: trip.id });
    log([`passenger:${p.id}`], "info", "You switched this one ride to Standard", "Your plan stays Women-Only for all other rides.", {
      tripId: trip.id,
    });
    later(() => runReplacement(trip.id), 1500);
  }
}

const NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  CONFIRMED: "DRIVER_EN_ROUTE",
  DRIVER_EN_ROUTE: "ARRIVED",
  ARRIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

function tripProgress(a: { tripId: number; driverId: number }) {
  const trip = getTrip(a.tripId);
  if (trip.driver_id !== a.driverId) fail("This trip isn't assigned to you.");
  const next = NEXT_STATUS[trip.status] ?? fail("No next step for this trip.");
  setStatus(trip.id, next);
  const d = getDriver(a.driverId);
  const p = passengerOf(trip);
  const who = firstName(d.name);
  const msg: Record<string, [EventKind, string, string]> = {
    DRIVER_EN_ROUTE: ["info", `${who} is on the way`, `${d.vehicle} · ${d.plate}`],
    ARRIVED: ["info", `${who} has arrived`, `At ${trip.from_label}. Free waiting: 5 minutes.`],
    IN_PROGRESS: ["info", "Your ride has started", `Heading to ${trip.to_label}. Safety help is one tap away.`],
    COMPLETED: ["success", "You've arrived!", `${rupees(trip.fare)} covered by your plan. How was ${who}?`],
  };
  const [kind, title, detail] = msg[next];
  log([`passenger:${p.id}`], kind, title, detail, { tripId: trip.id });
  log(["operator"], "info", `Trip #${trip.id}: ${next.replaceAll("_", " ").toLowerCase()}`, `${d.name} · ${p.name}`, {
    tripId: trip.id,
  });
}

function rateDriver(a: { tripId: number; passengerId: number; stars: number }) {
  const trip = getTrip(a.tripId);
  if (passengerOf(trip).id !== a.passengerId) fail("You can only rate your own rides.");
  if (trip.status !== "COMPLETED") fail("You can rate only after the ride is completed.");
  if (trip.rated) fail("You've already rated this ride.");
  if (!trip.driver_id) fail("No driver on this ride.");
  const stars = Math.max(1, Math.min(5, Math.round(a.stars)));
  run("UPDATE trips SET rated = 1 WHERE id = ?", trip.id);
  run("UPDATE drivers SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?", stars, trip.driver_id);
  log([`driver:${trip.driver_id}`], "success", `You got a ${stars}★ rating`, tripLabel(trip), { tripId: trip.id });
  log([`passenger:${a.passengerId}`], "info", "Thanks for rating", "Ratings are private and separate from safety reports.", {
    tripId: trip.id,
  });
}

function safetyReport(a: { tripId: number; passengerId: number }) {
  const trip = getTrip(a.tripId);
  const p = passengerOf(trip);
  if (p.id !== a.passengerId) fail("Not your ride.");
  const d = trip.driver_id ? getDriver(trip.driver_id) : null;
  log(["operator"], "danger", `PRIVATE safety report: trip #${trip.id}`,
    `Reported by ${p.name}${d ? ` · driver ${d.name} (${d.plate})` : ""}. Call passenger now.`, { tripId: trip.id });
  log([`passenger:${p.id}`], "warning", "Safety team notified",
    "Our team will call you right away. In an emergency, dial 112. This report is private and not shared with the driver.",
    { tripId: trip.id });
}

function toggleDuty(a: { driverId: number }) {
  const d = getDriver(a.driverId);
  run("UPDATE drivers SET on_duty = ? WHERE id = ?", d.on_duty ? 0 : 1, d.id);
  log(["operator", `driver:${d.id}`], "info", `${d.name} is now ${d.on_duty ? "offline" : "online"}`);
  if (!d.on_duty) {
    // A driver just came online: retry trips that are still waiting for someone.
    const waiting = many<Trip>(
      "SELECT * FROM trips WHERE status IN ('NO_ELIGIBLE_DRIVER', 'ASSIGNMENT_PENDING') AND date >= ? ORDER BY date, time",
      localDate(new Date()),
    );
    for (const t of waiting) runReplacement(t.id);
  }
}

// ---------- seed ----------

function seed() {
  const d = db();
  d.exec(`
    INSERT INTO passengers (id, phone, name, age, gender, women_verified) VALUES
      (1, '9876500002', 'Rahul Verma', 29, 'M', 0);
    INSERT INTO drivers (id, phone, name, gender, women_only_eligible, vehicle, plate, seats, rating_sum, rating_count) VALUES
      (1, '9800000001', 'Sunita Devi', 'F', 1, 'Auto', 'MH-12-RT-4521', 3, 48, 10),
      (2, '9800000002', 'Meena Kumari', 'F', 1, 'Auto', 'MH-12-KP-1187', 3, 47, 10),
      (3, '9800000003', 'Vikram Patil', 'M', 0, 'Cab · Dzire', 'MH-12-QW-9032', 4, 45, 10),
      (4, '9800000004', 'Arjun Singh', 'M', 0, 'Auto', 'MH-14-GH-2210', 3, 44, 10);
  `);
  // Rahul already has an active Standard plan with Vikram, so the dispatch board isn't empty.
  const baner = { label: "Baner", lat: 18.559, lng: 73.7868 };
  const hinjewadi = { label: "Hinjewadi IT Park", lat: 18.5912, lng: 73.7389 };
  const { planId } = createPlan({
    passengerId: 1, pickup: baner, dropoff: hinjewadi, days: [1, 2, 3, 4, 5, 6],
    pickupTime: "08:30", returnTime: "18:30", category: "STANDARD", duration: "MONTHLY",
  });
  operatorDecision({ planId, decision: "approve", primaryDriverId: 3 });
  payPlan({ planId, passengerId: 1 });
  d.exec("DELETE FROM events");
  log(["operator"], "info", "Demo data loaded", "4 drivers, 1 passenger with an active plan.");
}

// ---------- public API ----------

export function getState(): State {
  conn();
  return {
    today: localDate(new Date()),
    passengers: many<Passenger>("SELECT * FROM passengers ORDER BY id"),
    drivers: many<Driver>("SELECT * FROM drivers ORDER BY id"),
    plans: many<Plan>("SELECT * FROM plans ORDER BY id DESC"),
    trips: many<Trip>("SELECT * FROM trips ORDER BY date, time, id"),
    events: many("SELECT * FROM events ORDER BY id DESC LIMIT 300"),
  };
}

const ACTIONS = {
  requestOtp,
  verifyOtp,
  registerPassenger,
  verifyWomen,
  createPlan,
  operatorDecision,
  payPlan,
  driverUnavailable,
  passengerRecovery,
  tripProgress,
  rateDriver,
  safetyReport,
  toggleDuty,
  reset: () => {
    dropAll();
    g.__raahiSeeded = false;
    conn();
  },
} as const;

export type ActionType = keyof typeof ACTIONS;
export type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string };

export function act(type: string, payload: Record<string, unknown>): ActionResult {
  const fn = ACTIONS[type as ActionType] as ((p: never) => unknown) | undefined;
  if (!fn) return { ok: false, error: `Unknown action: ${type}` };
  try {
    const data = fn(payload as never);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong. Check the server log." };
  }
}
