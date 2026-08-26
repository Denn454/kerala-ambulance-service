"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

const STATUSES = ["NEW", "ACKNOWLEDGED", "CONTACTED", "DISPATCHED", "RESOLVED", "CANCELLED"];

export default function EmergencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [emergency, setEmergency] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/emergencies/${id}`, { cache: "no-store" });
    if (res.ok) setEmergency((await res.json()).emergency);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/drivers").then((r) => r.json()).then((d) => setDrivers(d.drivers ?? []));
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? []));
    fetch("/api/medical-staff").then((r) => r.json()).then((d) => setStaff(d.staff ?? []));
  }, []);

  async function claim() {
    const res = await fetch(`/api/emergencies/${id}/claim`, { method: "PATCH" });
    const data = await res.json();
    if (data.warning) setMessage({ type: "info", text: data.warning });
    if (data.emergency) setEmergency(data.emergency);
  }

  async function changeStatus(status: string) {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/emergencies/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, version: emergency.version }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
      load();
      return;
    }
    setEmergency((prev: any) => ({ ...prev, ...data.emergency }));
    setMessage({ type: "success", text: `Status updated to ${status}.` });
  }

  async function assign(field: "vehicleId" | "driverId" | "staffId", value: string) {
    setSaving(true);
    setMessage(null);
    const payload: any = { version: emergency.version };
    payload[field] = value || null;
    const res = await fetch(`/api/emergencies/${id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
      load();
      return;
    }
    load();
    setMessage({ type: "success", text: "Assignment updated." });
  }

  if (!emergency) return <p className="text-sm text-brand-800/60">Loading…</p>;

  const mapUrl =
    emergency.latitude && emergency.longitude
      ? `https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`
      : null;

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push("/admin/emergencies")} className="text-sm text-brand-600 hover:underline">
        ← Back to Emergencies
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-xl font-bold text-brand-900">{emergency.displayId}</h1>
        <StatusBadge status={emergency.status} />
      </div>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${message.type === "error" ? "bg-alert-600/10 text-alert-700" : "bg-brand-700/10 text-brand-800"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="Created">{new Date(emergency.createdAt).toLocaleString()}</Info>
        <Info label="Claimed by">{emergency.claimedBy?.name ?? "Unclaimed"}</Info>
        <Info label="Latitude">{emergency.latitude ?? "Not shared"}</Info>
        <Info label="Longitude">{emergency.longitude ?? "Not shared"}</Info>
        <Info label="Accuracy">{emergency.accuracy ? `${Math.round(emergency.accuracy)}m` : "—"}</Info>
        <Info label="Caller phone">{emergency.callerPhone ?? "Not provided"}</Info>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!emergency.claimedBy && (
          <button onClick={claim} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">
            Acknowledge / Claim
          </button>
        )}
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-brand-800 hover:bg-accent-sand">
            Open Map
          </a>
        )}
        {emergency.callerPhone && (
          <a href={`tel:${emergency.callerPhone}`} className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-brand-800 hover:bg-accent-sand">
            Call Caller
          </a>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-brand-900">Change Status</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={saving || s === emergency.status}
              onClick={() => changeStatus(s)}
              className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-accent-sand disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <AssignSelect
          label="Vehicle"
          value={emergency.assignedVehicleId ?? ""}
          options={vehicles.map((v: any) => ({ value: v.id, label: `${v.internalCode} — ${v.registrationNumber}` }))}
          onChange={(v) => assign("vehicleId", v)}
        />
        <AssignSelect
          label="Driver"
          value={emergency.assignedDriverId ?? ""}
          options={drivers.map((d: any) => ({ value: d.id, label: d.fullName }))}
          onChange={(v) => assign("driverId", v)}
        />
        <AssignSelect
          label="Medical Staff"
          value={emergency.assignedStaffId ?? ""}
          options={staff.map((s: any) => ({ value: s.id, label: s.fullName }))}
          onChange={(v) => assign("staffId", v)}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-brand-900">History</h2>
        <ul className="mt-2 space-y-2 text-sm text-brand-800/80">
          {emergency.history?.map((h: any) => (
            <li key={h.id} className="rounded-lg border border-border-subtle bg-white p-3">
              <span className="font-medium text-brand-900">{h.toStatus}</span>
              {h.note && <span> — {h.note}</span>}
              <span className="ml-2 text-xs text-brand-800/50">{new Date(h.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white p-3">
      <p className="text-xs text-brand-800/50">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-brand-900">{children}</p>
    </div>
  );
}

function AssignSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-brand-800/60">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border-subtle px-2 py-2 text-sm outline-none focus:border-brand-600"
      >
        <option value="">Unassigned</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
