# Raahi

Your daily commute, handled. Subscribe to a recurring ride once; if your driver can't make it, an eligible backup is assigned automatically, and a Women-Only booking is never silently switched to Standard.

Everything runs locally: Next.js + a SQLite file (`data/raahi.db`, built into Node 24). No accounts, API keys or internet needed.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. On a wide screen you'll see the Passenger, Operator and Driver apps side by side; on a phone, switch between them with the tabs.

## Demo script

1. **Passenger (Priya):** New plan → Women-Only → Request plan.
2. **Operator:** male drivers are greyed out as "not Women-Only eligible". Pick Sunita → Accept plan.
3. **Passenger:** Pay (demo). Trips for the next 7 days appear, all confirmed with Sunita.
4. **Driver (Sunita):** today's trip → Can't make it → Feeling sick.
5. Watch: "Finding replacement" → Meena is auto-assigned. The operator log shows who was skipped and why.
6. Optional: switch the driver picker to Meena and report a breakdown too. No eligible Women-Only driver is left, so Priya chooses: keep waiting, cancel with a refund, or switch that one trip to Standard herself.
7. Driver: Head to pickup → I've arrived → Start trip → Complete trip. Priya rates the driver.

**Reset demo** (top right) wipes the database back to the starting data.

## Code map

- `lib/raahi.ts`: all business rules (plan approval, trip generation, backup dispatch, Women-Only rule, ratings, safety reports)
- `lib/db.ts`: SQLite schema
- `lib/shared.ts`: types, places, pricing
- `components/`: Passenger, Operator and Driver panels
- `app/api/state`, `app/api/action`: the two API routes the UI polls and calls
