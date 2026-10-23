// Types, places and pricing shared by the server and the UI.

export type Category = "STANDARD" | "WOMEN_ONLY";
export type Duration = "MONTHLY" | "TERM" | "ANNUAL";
export type EventKind = "info" | "success" | "warning" | "danger";

export type PlanStatus =
  | "PENDING_OPERATOR_CONFIRMATION"
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "REJECTED";

export type TripStatus =
  | "ASSIGNMENT_PENDING"
  | "CONFIRMED"
  | "REPLACEMENT_SEARCHING"
  | "NO_ELIGIBLE_DRIVER"
  | "DRIVER_EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_REFUNDED";

export interface Passenger {
  id: number;
  name: string;
  gender: "F" | "M";
  women_verified: number;
  credit: number;
}

export interface Driver {
  id: number;
  name: string;
  gender: "F" | "M";
  women_only_eligible: number;
  vehicle: string;
  plate: string;
  seats: number;
  on_duty: number;
  rating_sum: number;
  rating_count: number;
}

export interface Plan {
  id: number;
  passenger_id: number;
  pickup: string;
  dropoff: string;
  days: string;
  pickup_time: string;
  return_time: string | null;
  category: Category;
  duration: Duration;
  monthly_price: number;
  status: PlanStatus;
  primary_driver_id: number | null;
  created_at: string;
}

export interface Trip {
  id: number;
  plan_id: number;
  date: string;
  time: string;
  direction: "OUTBOUND" | "RETURN";
  from_place: string;
  to_place: string;
  category: Category;
  fare: number;
  status: TripStatus;
  driver_id: number | null;
  unavailable_ids: string;
  rated: number;
}

export interface RaahiEvent {
  id: number;
  ts: string;
  audience: string;
  kind: EventKind;
  title: string;
  detail: string;
  trip_id: number | null;
  plan_id: number | null;
}

export interface State {
  today: string;
  passengers: Passenger[];
  drivers: Driver[];
  plans: Plan[];
  trips: Trip[];
  events: RaahiEvent[];
}

export const PLACES = [
  { id: "kothrud", name: "Home · Kothrud", x: 0, y: 0 },
  { id: "karvenagar", name: "Home · Karve Nagar", x: 1, y: -2 },
  { id: "baner", name: "Home · Baner", x: -2, y: 7 },
  { id: "fc-road", name: "Fergusson College · FC Road", x: 5, y: 2 },
  { id: "shivajinagar", name: "Shivajinagar Station", x: 6, y: 3 },
  { id: "hinjewadi", name: "Office · Hinjewadi IT Park", x: -8, y: 11 },
  { id: "vimannagar", name: "Office · Viman Nagar", x: 14, y: 6 },
] as const;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DURATIONS: Record<Duration, { label: string; months: number; discount: number }> = {
  MONTHLY: { label: "Monthly", months: 1, discount: 0 },
  TERM: { label: "Term · 4 months", months: 4, discount: 0.05 },
  ANNUAL: { label: "Annual", months: 12, discount: 0.12 },
};

export function placeName(id: string): string {
  return PLACES.find((p) => p.id === id)?.name ?? id;
}

export function distanceKm(from: string, to: string): number {
  const a = PLACES.find((p) => p.id === from);
  const b = PLACES.find((p) => p.id === to);
  if (!a || !b) return 0;
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 1.3 * 10) / 10;
}

export function quote(input: {
  pickup: string;
  dropoff: string;
  days: number[];
  hasReturn: boolean;
  duration: Duration;
}) {
  const km = distanceKm(input.pickup, input.dropoff);
  const perTrip = Math.round(30 + 11 * km);
  const tripsPerMonth = Math.round(input.days.length * 4.3 * (input.hasReturn ? 2 : 1));
  // Subscribers get 15% off pay-per-ride, plus a longer-duration discount.
  const d = DURATIONS[input.duration];
  const monthly = Math.round((perTrip * tripsPerMonth * 0.85 * (1 - d.discount)) / 10) * 10;
  return { km, perTrip, tripsPerMonth, monthly, total: monthly * d.months };
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
