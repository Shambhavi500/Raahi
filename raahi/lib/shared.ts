// Types, places and pricing shared by the server and the UI.

export type Category = "STANDARD" | "WOMEN_ONLY";
export type Duration = "MONTHLY" | "TERM" | "ANNUAL";
export type EventKind = "info" | "success" | "warning" | "danger";
export type Gender = "F" | "M" | "X" | "U";
export type Role = "passenger" | "driver" | "operator";

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

export interface Loc {
  label: string;
  lat: number;
  lng: number;
}

export interface Passenger {
  id: number;
  phone: string;
  name: string;
  age: number;
  gender: Gender;
  women_verified: number;
  credit: number;
}

export interface Driver {
  id: number;
  phone: string;
  name: string;
  gender: Gender;
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
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lng: number;
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
  from_label: string;
  from_lat: number;
  from_lng: number;
  to_label: string;
  to_lat: number;
  to_lng: number;
  category: Category;
  fare: number;
  status: TripStatus;
  status_at: string;
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

export type PlaceKind = "home" | "college" | "office" | "transit";

// Pilot city: Pune. Real coordinates so the map looks right.
export const PLACES: (Loc & { id: string; area: string; kind: PlaceKind })[] = [
  { id: "kothrud", label: "Kothrud", area: "Karve Road", kind: "home", lat: 18.5074, lng: 73.8077 },
  { id: "karvenagar", label: "Karve Nagar", area: "Near Warje", kind: "home", lat: 18.4891, lng: 73.8199 },
  { id: "baner", label: "Baner", area: "Baner Road", kind: "home", lat: 18.559, lng: 73.7868 },
  { id: "wakad", label: "Wakad", area: "Near Hinjewadi", kind: "home", lat: 18.5975, lng: 73.7707 },
  { id: "aundh", label: "Aundh", area: "ITI Road", kind: "home", lat: 18.558, lng: 73.8077 },
  { id: "fc", label: "Fergusson College", area: "FC Road, Shivajinagar", kind: "college", lat: 18.5236, lng: 73.841 },
  { id: "coep", label: "COEP Technological University", area: "Shivajinagar", kind: "college", lat: 18.5293, lng: 73.8565 },
  { id: "mitwpu", label: "MIT World Peace University", area: "Kothrud", kind: "college", lat: 18.5181, lng: 73.8152 },
  { id: "hinjewadi", label: "Hinjewadi IT Park", area: "Phase 1, Hinjewadi", kind: "office", lat: 18.5912, lng: 73.7389 },
  { id: "eon", label: "EON IT Park", area: "Kharadi", kind: "office", lat: 18.5515, lng: 73.9474 },
  { id: "magarpatta", label: "Magarpatta City", area: "Hadapsar", kind: "office", lat: 18.5157, lng: 73.9272 },
  { id: "vimannagar", label: "Viman Nagar", area: "Near Airport", kind: "office", lat: 18.5679, lng: 73.9143 },
  { id: "shivajinagar", label: "Shivajinagar Station", area: "Railway station", kind: "transit", lat: 18.5314, lng: 73.8446 },
  { id: "punestation", label: "Pune Railway Station", area: "Agarkar Nagar", kind: "transit", lat: 18.5286, lng: 73.8743 },
  { id: "swargate", label: "Swargate Bus Stand", area: "Swargate", kind: "transit", lat: 18.5018, lng: 73.8636 },
];

export const CITY_CENTER = { lat: 18.53, lng: 73.85 };

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DURATIONS: Record<Duration, { label: string; short: string; months: number; discount: number }> = {
  MONTHLY: { label: "Monthly", short: "1 month", months: 1, discount: 0 },
  TERM: { label: "Term", short: "4 months", months: 4, discount: 0.05 },
  ANNUAL: { label: "Annual", short: "12 months", months: 12, discount: 0.12 },
};

// Straight-line distance times a road factor; good enough for pricing a pilot.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h)) * 1.35;
  return Math.round(km * 10) / 10;
}

// A point along the gentle curve the map draws between two places (t from 0 to 1).
export function curvePoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }, t: number) {
  const c = { lat: (a.lat + b.lat) / 2 - (b.lng - a.lng) * 0.18, lng: (a.lng + b.lng) / 2 + (b.lat - a.lat) * 0.18 };
  return {
    lat: (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * c.lat + t ** 2 * b.lat,
    lng: (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * c.lng + t ** 2 * b.lng,
  };
}

export function nearestPlace(p: { lat: number; lng: number }) {
  return [...PLACES].sort((a, b) => distanceKm(p, a) - distanceKm(p, b))[0];
}

export function quote(input: { pickup: Loc; dropoff: Loc; days: number[]; hasReturn: boolean; duration: Duration }) {
  const km = distanceKm(input.pickup, input.dropoff);
  const perTrip = Math.round(30 + 11 * km);
  const tripsPerMonth = Math.round(input.days.length * 4.3 * (input.hasReturn ? 2 : 1));
  // Subscribers get 15% off pay-per-ride, plus a longer-duration discount.
  const d = DURATIONS[input.duration];
  const payPerRide = perTrip * tripsPerMonth;
  const monthly = Math.round((payPerRide * 0.85 * (1 - d.discount)) / 10) * 10;
  return { km, perTrip, tripsPerMonth, monthly, total: monthly * d.months, saved: payPerRide - monthly };
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const DEMO_OTP_HINT = "Demo mode: the code is shown on screen instead of being sent by SMS.";
export const OPERATOR_PHONE = "9000000000";
