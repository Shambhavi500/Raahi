# Raahi

Your daily commute, handled. Subscribe to a recurring college or office ride once; a verified fleet confirms every trip, and if your driver can't make it, an eligible backup is assigned automatically. A Women-Only booking is never silently switched to Standard.

Runs on your PC: Next.js plus a local SQLite file (`data/raahi.db`, built into Node 24). No accounts or API keys. The map uses free OpenStreetMap tiles, so it needs an internet connection to draw streets; everything else works offline.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Page | Who it's for |
| --- | --- |
| `/` | Start page: choose Ride or Drive |
| `/passenger` | Passenger app (phone-first, Uber-style) |
| `/driver` | Driver app |
| `/operator` | Fleet operator console |
| `/demo` | All three apps side by side, for judges |

Login is by phone number and a 4-digit code. In demo mode the code is shown on screen ("Demo SMS") instead of being texted.

## Demo script

1. Open `/demo` (or the three pages in separate tabs). Tap **Reset demo** first.
2. **Passenger:** Get started → any new 10-digit number (e.g. 91234 56780) → **Fill** the code → name **Priya** → age **21** → **Woman** → **Verify now (demo)**.
3. **Passenger:** *Where do you go every day?* → pickup **Kothrud** → drop **Fergusson College** (or set either on the map) → Weekdays, 8:30 AM, ride back 5:30 PM → **Raahi Women-Only** → Review → **Request plan**.
4. **Operator:** log in with **Saarthi Fleets** → Requests: male drivers are greyed out as "not Women-Only eligible" → pick **Sunita** → **Accept plan**.
5. **Passenger:** screen updates to "You're confirmed!" → **Pay (demo)** → "You're all set".
6. **Driver:** log in as **Sunita Devi** → next ride → **Start: head to pickup**. The passenger sees Sunita's car moving on the map.
7. **Driver:** **I can't make this ride** → *Feeling sick*. Passenger sees "Finding a verified backup…", then Meena is assigned. The operator's Activity log lists who was skipped and why.
8. Optional: log in as Meena and drop out too. No eligible Women-Only driver is left, so Priya chooses: keep waiting, cancel with a refund, or switch that one ride to Standard herself.
9. Driver: arrived → start ride → complete. Passenger rates the driver.

## Code map

- `lib/raahi.ts`: business rules (OTP login, sign-up checks, plan approval, trip generation, backup dispatch, Women-Only rule, ratings, safety reports)
- `lib/db.ts`: SQLite schema
- `lib/shared.ts`: types, Pune places, distance and pricing
- `lib/client.ts`: polling hook and per-role login sessions
- `components/passenger/`: onboarding, booking steps, rides and live trip screens
- `components/driver/`, `components/operator/`: the other two apps
- `components/map/RaahiMap.tsx`: Leaflet map (route, pickup/drop pins, moving driver)
- `app/api/state`, `app/api/action`: the two API routes every app uses
