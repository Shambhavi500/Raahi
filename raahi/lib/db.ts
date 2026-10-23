import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// Everything lives in one local SQLite file: raahi/data/raahi.db
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "raahi.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS passengers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  women_verified INTEGER NOT NULL DEFAULT 0,
  credit INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  women_only_eligible INTEGER NOT NULL DEFAULT 0,
  vehicle TEXT NOT NULL,
  plate TEXT NOT NULL,
  seats INTEGER NOT NULL,
  on_duty INTEGER NOT NULL DEFAULT 1,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY,
  passenger_id INTEGER NOT NULL REFERENCES passengers(id),
  pickup TEXT NOT NULL,
  dropoff TEXT NOT NULL,
  days TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  return_time TEXT,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  monthly_price INTEGER NOT NULL,
  status TEXT NOT NULL,
  primary_driver_id INTEGER REFERENCES drivers(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  direction TEXT NOT NULL,
  from_place TEXT NOT NULL,
  to_place TEXT NOT NULL,
  category TEXT NOT NULL,
  fare INTEGER NOT NULL,
  status TEXT NOT NULL,
  driver_id INTEGER REFERENCES drivers(id),
  unavailable_ids TEXT NOT NULL DEFAULT ',',
  rated INTEGER NOT NULL DEFAULT 0,
  UNIQUE (driver_id, date, time)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  ts TEXT NOT NULL,
  audience TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  trip_id INTEGER,
  plan_id INTEGER
);
`;

const g = globalThis as unknown as { __raahiDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__raahiDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    d.exec(SCHEMA);
    g.__raahiDb = d;
  }
  return g.__raahiDb;
}

export function dropAll() {
  db().exec(
    "DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS trips; DROP TABLE IF EXISTS plans; DROP TABLE IF EXISTS drivers; DROP TABLE IF EXISTS passengers;",
  );
  db().exec(SCHEMA);
}
