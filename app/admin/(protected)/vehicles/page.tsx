"use client";

import { useEffect, useState } from "react";

type Vehicle = {
  id: string;
  internalCode: string;
  registrationNumber: string;
  status: string;
  driverId: string | null;
  driver?: { fullName: string } | null;
};

const STATUSES = ["AVAILABLE", "ON_DUTY", "BUSY", "MAINTENANCE", "INACTIVE"];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form, setForm] = useState({ internalCode: "", registrationNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const [editingReg, setEditingReg] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/vehicles");
    setVehicles((await res.json()).vehicles ?? []);
  }

  useEffect(() => {
    load();
    fetch("/api/drivers").then((r) => r.json()).then((d) => setDrivers(d.drivers ?? []));
  }, []);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Failed to add vehicle.");
      return;
    }
    setForm({ internalCode: "", registrationNumber: "" });
    load();
  }

  async function saveRegistration(id: string) {
    const registrationNumber = editingReg[id];
    if (!registrationNumber) return;
    await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber }),
    });
    setEditingReg((prev) => { const n = { ...prev }; delete n[id]; return n; });
    load();
  }

  async function updateField(id: string, field: string, value: any) {
    await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Vehicles</h1>

      <form onSubmit={addVehicle} className="mt-4 grid gap-3 rounded-xl border border-border-subtle bg-white p-4 sm:grid-cols-3">
        <input required placeholder="Internal code (e.g. AMB-001)" value={form.internalCode} onChange={(e) => setForm({ ...form, internalCode: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <input required placeholder="Registration (e.g. KL-01-AB-1234)" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">Add Vehicle</button>
        {error && <p className="sm:col-span-3 text-sm text-alert-600">{error}</p>}
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-sand text-xs uppercase text-brand-800/60">
            <tr>
              <th className="p-3">Vehicle ID</th>
              <th className="p-3">Registration</th>
              <th className="hidden p-3 sm:table-cell">Driver</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="p-3 font-mono font-medium text-brand-900">{v.internalCode}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={v.registrationNumber}
                      onChange={(e) => setEditingReg((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      className="w-36 rounded-md border border-border-subtle px-2 py-1 text-sm"
                    />
                    {editingReg[v.id] && editingReg[v.id] !== v.registrationNumber && (
                      <button onClick={() => saveRegistration(v.id)} className="text-xs font-medium text-brand-600 hover:underline">Save</button>
                    )}
                  </div>
                </td>
                <td className="hidden p-3 sm:table-cell">
                  <select value={v.driverId ?? ""} onChange={(e) => updateField(v.id, "driverId", e.target.value || null)} className="rounded-md border border-border-subtle px-2 py-1 text-xs">
                    <option value="">Unassigned</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <select value={v.status} onChange={(e) => updateField(v.id, "status", e.target.value)} className="rounded-md border border-border-subtle px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-brand-800/60">No vehicles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
