"use client";

import { useEffect, useState } from "react";

type Staff = {
  id: string;
  fullName: string;
  phone: string;
  role: string | null;
  status: string;
  vehicleId: string | null;
};

const STATUSES = ["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "INACTIVE"];

export default function MedicalStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: "", phone: "", role: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/medical-staff");
    setStaff((await res.json()).staff ?? []);
  }

  useEffect(() => {
    load();
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? []));
  }, []);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/medical-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Failed to add staff member.");
      return;
    }
    setForm({ fullName: "", phone: "", role: "" });
    load();
  }

  async function updateField(id: string, field: string, value: any) {
    await fetch(`/api/medical-staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Medical Staff</h1>

      <form onSubmit={addStaff} className="mt-4 grid gap-3 rounded-xl border border-border-subtle bg-white p-4 sm:grid-cols-4">
        <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <input placeholder="Role (e.g. Paramedic)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-border-subtle px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">Add Staff</button>
        {error && <p className="sm:col-span-4 text-sm text-alert-600">{error}</p>}
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-sand text-xs uppercase text-brand-800/60">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="hidden p-3 sm:table-cell">Role</th>
              <th className="hidden p-3 md:table-cell">Vehicle</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-medium text-brand-900">{s.fullName}</td>
                <td className="p-3 text-brand-800/70">{s.phone}</td>
                <td className="hidden p-3 text-brand-800/70 sm:table-cell">{s.role ?? "—"}</td>
                <td className="hidden p-3 md:table-cell">
                  <select value={s.vehicleId ?? ""} onChange={(e) => updateField(s.id, "vehicleId", e.target.value || null)} className="rounded-md border border-border-subtle px-2 py-1 text-xs">
                    <option value="">Unassigned</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.internalCode}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <select value={s.status} onChange={(e) => updateField(s.id, "status", e.target.value)} className="rounded-md border border-border-subtle px-2 py-1 text-xs">
                    {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-brand-800/60">No medical staff yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
