"use client";

import { useEffect, useState } from "react";

type Driver = {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  status: string;
  experienceYrs: number | null;
};

const STATUSES = ["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "INACTIVE"];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState({ fullName: "", phone: "", licenseNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/drivers");
    const data = await res.json();
    setDrivers(data.drivers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Failed to add driver.");
      return;
    }
    setForm({ fullName: "", phone: "", licenseNumber: "" });
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/drivers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deactivate(id: string) {
    await fetch(`/api/drivers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Drivers</h1>

      <form onSubmit={addDriver} className="mt-4 grid gap-3 rounded-xl border border-border-subtle bg-white p-4 sm:grid-cols-4">
        <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <input required placeholder="License number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">Add Driver</button>
        {error && <p className="sm:col-span-4 text-sm text-alert-600">{error}</p>}
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-sand text-xs uppercase text-brand-800/60">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="hidden p-3 sm:table-cell">License</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {drivers.map((d) => (
              <tr key={d.id}>
                <td className="p-3 font-medium text-brand-900">{d.fullName}</td>
                <td className="p-3 text-brand-800/70">{d.phone}</td>
                <td className="hidden p-3 text-brand-800/70 sm:table-cell">{d.licenseNumber}</td>
                <td className="p-3">
                  <select value={d.status} onChange={(e) => updateStatus(d.id, e.target.value)} className="rounded-md border border-border-subtle px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <button onClick={() => deactivate(d.id)} className="text-xs text-alert-600 hover:underline">Deactivate</button>
                </td>
              </tr>
            ))}
            {!loading && drivers.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-brand-800/60">No drivers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
