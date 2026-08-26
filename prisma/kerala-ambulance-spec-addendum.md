# Addendum: Gap Fixes for Kerala Emergency Ambulance Platform

This extends the original spec with concrete designs for the four gaps identified in review: admin-offline escalation, concurrent assignment, DPDP-compliant privacy handling, and low-connectivity resilience.

---

## 1. Escalation Path When No Admin Is Online

**Problem:** A WebSocket push only helps if someone is looking at the dashboard. For a life-safety system, "nobody saw the alert" cannot be an acceptable failure mode.

**Design: tiered escalation with acknowledgment deadlines**

```
Emergency created
      │
      ▼
WebSocket broadcast to all connected admins (t=0s)
      │
      ▼
Is it ACKNOWLEDGED within 60s?
      │
   ┌──┴───┐
  YES     NO
   │       │
   │       ▼
   │   Escalation Tier 1 (t=60s)
   │   → SMS to on-duty admin(s) via SMS_CONFIG
   │   → Automated voice call to on-duty admin (Twilio/similar)
   │       │
   │       ▼
   │   Still not ACKNOWLEDGED? (t=180s)
   │       │
   │       ▼
   │   Escalation Tier 2
   │   → SMS/call to secondary/backup admin list
   │   → Flag emergency as ESCALATED in dashboard (persistent red banner)
   │       │
   │       ▼
   │   Still not ACKNOWLEDGED? (t=300s)
   │       │
   │       ▼
   │   Escalation Tier 3
   │   → Call control room landline directly (if distinct from admin)
   │   → Log CRITICAL audit event
   ▼
RESOLVED / dispatched normally
```

**Schema additions:**
```
on_duty_schedule (admin_id, shift_start, shift_end, priority_tier)
escalation_events (id, emergency_id, tier, triggered_at, method, target, delivery_status)
```

**Key implementation notes:**
- Acknowledgment deadline (60s) must be configurable per deployment, not hardcoded.
- Escalation calls/SMS need a dedicated queue worker (not inline in the request handler) so a slow SMS provider never blocks emergency creation.
- The caller-facing side is unaffected — they've already called the control room directly per the original "phone call independent from backend" design. This escalation path is purely for ensuring the *web-reported* location/details don't sit unseen.
- Track delivery status per escalation attempt (sent/delivered/failed) — if the SMS provider itself fails, that needs its own alert (e.g., a secondary always-on monitoring service or simple uptime check).

---

## 2. Concurrent Assignment Handling

**Problem:** Two admins could both open the same emergency and both assign a vehicle, or one dispatches a driver who was just assigned elsewhere seconds ago.

**Design: optimistic locking + explicit claim step**

Add a `version` column (or `updated_at` used as a token) to `emergency_requests`, `drivers`, and `vehicles`. Every update includes the version it was read at:

```sql
UPDATE emergency_requests
SET status = 'DISPATCHED', assigned_vehicle_id = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

If zero rows update, the client re-fetches and shows: *"This emergency was just updated by another admin — refresh to see current state."*

**Additionally, add a lightweight claim mechanism** so two admins don't even start assigning the same emergency simultaneously:

```
claimed_by (admin_id, nullable)
claimed_at (timestamp, nullable)
```

- Clicking "View" doesn't claim it. Clicking "Acknowledge" sets `claimed_by`/`claimed_at`.
- Claims auto-expire after N minutes of inactivity (e.g., 10 min) so a distracted admin doesn't permanently block others.
- Dashboard shows "Being handled by [Admin Name]" on claimed emergencies, but any admin can still take over if needed (this is a coordination hint, not a hard lock — hard locks are dangerous in emergency systems where the "wrong" admin acting is still better than nobody acting).

**Vehicle/driver double-booking:** before confirming an assignment, check `vehicle_assignments`/driver status server-side (not just client-side) inside the same transaction as the status update, and reject with a clear conflict message if the driver/vehicle was assigned to a different active emergency in the last few seconds.

---

## 3. DPDP-Compliant Privacy & Retention

**Problem:** The original spec says "implement suitable privacy notices" without specifics. For location data collected during a medical crisis, this needs to be concrete.

**Concrete policy:**

| Data | Collected when | Retention | Access |
|---|---|---|---|
| Caller GPS (lat/lng/accuracy) | Emergency request only | 90 days post-resolution, then anonymized/aggregated (drop precise coords, keep district-level stats) | Admin/control-room staff only, audit-logged |
| Caller phone number (if captured) | Emergency request | Same as above | Same |
| "Nearest blood bank" location query | Only on explicit user action | Not stored — process in-memory, discard after response | N/A |
| Emergency records (non-location fields: status, notes, timestamps) | All emergencies | Retained per organizational/legal record-keeping requirement (commonly longer for liability reasons) — this should be set by the org's legal counsel, not assumed | Admin, audit-logged |
| Audit logs | All admin actions | Retained separately, longer term, for accountability | Restricted to designated compliance role |

**Consent & notice requirements under DPDP:**
- Before requesting geolocation, the permission prompt context (the in-app text, not the OS dialog) must state *why* it's collected and that it's a one-time capture, not continuous tracking — the current spec already gets this right functionally; it just needs the notice text finalized alongside legal review.
- Provide a privacy notice page linked from the emergency flow, not buried only in a footer.
- Build a data-subject request handler (even a simple admin-initiated one) for "delete my emergency record" requests — DPDP gives data principals rights to request erasure; the system needs a documented process, even if manual initially.
- Do not send location data to third-party map providers' client-side SDKs with more precision than needed for the admin's viewing map — if using a provider like Google Maps, confirm their data handling terms are compatible with your DPDP obligations before committing to that provider over a self-hosted OSM tile solution.

**This section should still go to actual legal counsel before production** — the above gives your engineering team concrete fields to build against, but retention periods and consent language need sign-off from someone qualified in Indian data protection law.

---

## 4. Offline / Low-Connectivity Handling

**Problem:** Rural Kerala users on weak 3G/4G during a crisis moment can't afford a form that silently fails to submit.

**Design: client-side queue with guaranteed delivery attempt**

```
User taps SHARE MY LOCATION
      │
      ▼
Geolocation captured (works offline — GPS doesn't need network)
      │
      ▼
Attempt POST /api/emergencies
      │
   ┌──┴───┐
 SUCCESS  FAILURE (timeout/offline)
   │        │
   │        ▼
   │   Store request in localStorage/IndexedDB with retry flag
   │        │
   │        ▼
   │   Show: "Location saved. We'll keep trying to send it —
   │          please stay on the call with the control room."
   │        │
   │        ▼
   │   Background retry: exponential backoff (2s, 5s, 15s, 30s...)
   │   + retry on 'online' event (navigator.onLine / online listener)
   │        │
   │        ▼
   │   On success: clear queue, update UI to REQUEST SUBMITTED
   ▼
REQUEST SUBMITTED
```

**Key points:**
- The phone call to the control room is never blocked by any of this — it's dialed immediately via `tel:` regardless of network state, per the original architecture. This queue only affects the *supplementary* location-to-admin path.
- Use a short request timeout (e.g., 5–8s) before falling into the queued/retry state — don't leave the user staring at a spinner on bad rural connections.
- If a Service Worker is in scope (PWA-style), use Background Sync API for retry instead of relying on the tab staying open — a user may navigate away or the browser may be backgrounded once they're on the phone call.
- Idempotency: include a client-generated request UUID (not the authoritative emergency ID, which the backend still generates) so retried submissions don't create duplicate emergency records if a request actually succeeded but the response was lost.
- Same pattern should apply to the initial GPS *acquisition* — if `getCurrentPosition` times out (common indoors or under tree cover in rural areas), fall back to a lower-accuracy/faster position request rather than failing outright, and let the admin call the user back for verbal directions as the ultimate fallback (which the existing "call control room directly" flow already supports).

---

## Summary of schema/infra additions needed

- `on_duty_schedule`, `escalation_events` tables + a queue worker for SMS/voice escalation
- `version` (optimistic lock) columns + `claimed_by`/`claimed_at` on `emergency_requests`
- Documented retention/anonymization job (scheduled task, 90-day sweep on location fields)
- Client-side request queue (IndexedDB) + optional Service Worker background sync for emergency submission
