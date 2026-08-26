# Kerala Emergency Ambulance Service — Platform

A public emergency-request website + admin/control-room dashboard, built with
Next.js 14 (App Router), TypeScript, Tailwind CSS, and Prisma.

This is **Phase 1** of the full spec: the parts where a bug actually costs
someone real harm. See [Scope & what's deferred](#scope--whats-deferred)
for what's intentionally not built yet, and why.

---

## What's included

- **Public emergency flow**: tap Emergency → dial the control room via
  `tel:` immediately (works even if the site's backend is down) → request
  the caller's location once → submit it to the backend with an
  offline-retry queue, so a dropped connection on rural mobile data doesn't
  silently lose the request.
- **Admin dashboard**: polling-based live emergency feed (refreshes every 5s
  — no WebSocket infrastructure to operate), claim/acknowledge, status
  changes, and vehicle/driver/medical-staff assignment with server-side
  double-booking checks and optimistic-locking conflict detection.
- **Fleet & staff management**: drivers, vehicles (registration number
  editable independently of the internal vehicle code, per spec), medical
  staff — full CRUD.
- **Auth**: cookie-based admin sessions (JWT), password hashing, all admin
  routes and admin APIs protected by middleware.
- **Configurable control-room number**: set once in Admin → Settings, used
  everywhere on the public site — never hardcoded.
- Responsive throughout, `prefers-reduced-motion` respected, keyboard-
  focusable controls.

## Scope & what's deferred

Building the *entire* original spec (i18n, blood-bank directory, first-aid
CMS, animations, WebSockets, admin-escalation SMS/voice alerts, DPDP
consent tooling) as a single first pass would produce something that never
actually ships. Instead, this gets the life-safety-critical path — the
emergency flow and the admin's ability to see and act on it — fully
working and testable, and leaves the rest as clean extension points:

- **No i18n / Malayalam** yet — the `Settings`/content model doesn't yet
  have a translations table. Add a `translations` model in
  `prisma/schema.prisma` and an `i18n` library (e.g. `next-intl`) when
  ready.
- **No blood-bank directory or first-aid CMS** — these are pure content
  features, not on the safety-critical path. Straightforward to add as new
  Prisma models + admin CRUD pages following the same pattern as
  Drivers/Vehicles here.
- **No WebSocket real-time push** — the admin dashboard polls every 5
  seconds instead. This removes an entire category of production bugs
  (reconnect logic, socket auth) for a few seconds of latency that don't
  matter, since the caller's phone call to the control room is the actual
  time-critical path and is independent of this dashboard.
- **No SMS/voice escalation** if no admin is online to see a new
  emergency — this is the most important thing to add next for a real
  deployment. Intended design: tiered escalation — SMS at 60s unacknowledged,
  automated voice call at 180s, secondary admin at 300s — via a queued
  background worker so a slow SMS provider never blocks emergency creation.
- **No animations/Framer Motion** — deliberately kept out so nothing ever
  interferes with the emergency button's responsiveness.
- **DPDP/privacy tooling is minimal** — location data is stored, not
  auto-anonymized after 90 days, and there's no self-service data-deletion
  request flow yet. Needs real legal review before production use with
  real callers.

None of the above blocks you from running and testing the core system
today.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"          # SQLite for local dev — see note below
JWT_SECRET="generate-a-long-random-string-here"
CONTROL_ROOM_PHONE="+91XXXXXXXXXX"    # used only by the seed script's default
```

Generate a real `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Create the database and generate the Prisma client

```bash
npx prisma generate
npx prisma migrate dev --name init
```

> **Note on the sandbox this was built in:** the environment this code was
> written in has a restricted network allowlist that blocks
> `binaries.prisma.sh`, so `prisma generate` / `migrate dev` could **not**
> be run or verified there. On your own machine (VS Code, normal internet
> access) these commands should work normally — but treat this as
> **untested**, not verified, until you've run it yourself. If you hit
> Prisma engine download errors on a machine that also has restricted
> network access, see Prisma's docs on offline installs
> (`PRISMA_ENGINES_MIRROR` / `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING`).

### 4. Seed the first admin login

```bash
npm run db:seed
```

This creates `admin@example.com` / `ChangeMe123!` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before running) —
**change this password immediately** by adding a "change password" flow
before any real deployment; it doesn't exist yet.

### 5. Run it

```bash
npm run dev
```

- Public site: <http://localhost:3000>
- Admin login: <http://localhost:3000/admin/login>

---

## Moving to Postgres for production

The schema currently targets SQLite for zero-setup local dev. To switch to
Postgres (as the original spec calls for):

1. In `prisma/schema.prisma`, change:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` in `.env` to your Postgres connection string.
3. Run `npx prisma migrate dev --name init` again against the new database.

No application code changes are needed — Prisma abstracts this.

---

## Project structure

```
app/
  (site)/            Public website (home, about, services, contact)
  admin/
    login/            Public login page (outside the auth-gated layout)
    (protected)/       Everything behind session auth: dashboard, emergencies,
                        drivers, vehicles, medical-staff, settings
  api/
    auth/              login / logout / me
    emergencies/       create (public), list + detail + status + assign + claim (admin)
    drivers/            CRUD
    vehicles/           CRUD (registration number editable independently)
    medical-staff/      CRUD
    settings/           admin read/write + a public-only phone-number endpoint
components/           Shared UI: EmergencyFlow, SiteHeader/Footer, AdminShell, StatusBadge
lib/
  prisma.ts            Prisma client singleton
  auth.ts              Password hashing, JWT session helpers
  emergencyId.ts        Server-side EMG-YYYY-NNNNNN ID generator
  emergencyQueue.ts      Client-side offline-retry queue for the emergency button
  useEmergencyPolling.ts  Admin dashboard polling hook
middleware.ts          Route protection for /admin/* and admin APIs
prisma/
  schema.prisma         Data model
  seed.ts                Creates the first admin login + default settings
```

## Design decisions worth knowing about

- **The phone call is never gated on the network.** `tel:` is dialed
  immediately when the Emergency button is tapped, before any fetch
  happens. If the backend is completely down, the call still works.
- **Optimistic locking (`version` field)** on `EmergencyRequest` prevents
  two admins from silently overwriting each other's status/assignment
  changes — a conflicting write is rejected with a clear message instead
  of one admin's action silently vanishing.
- **`claimedBy`/`claimedAt` is a coordination hint, not a hard lock** — any
  admin can still act on a claimed emergency. In an emergency system, the
  "wrong" admin acting beats nobody acting because a lock got stuck.
- **Idempotent submission (`clientRequestId`)** — the offline-retry queue
  can safely retry a submission multiple times; the backend returns the
  original record instead of creating a duplicate if it already succeeded.
- **Soft-deletes** for drivers/vehicles/staff (status → `INACTIVE`) instead
  of hard deletes, so historical emergency records that reference them
  stay intact.

## What to build next, in order

1. **Admin escalation** (SMS/voice alert if a new emergency isn't
   acknowledged within N seconds) — see above for the tiered design. This
   is the single biggest gap for a real deployment.
2. **Password change / admin management UI** — right now there's no way
   to change a password or add a second admin from the UI (only via
   `db:seed` or Prisma Studio).
3. Blood-bank directory, first-aid content, Malayalam translations —
   content features, additive, don't touch the safety-critical path.
4. Real map embed on the emergency detail page (currently links out to
   Google Maps) once you've picked and licensed a map provider.
