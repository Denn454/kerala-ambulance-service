"use client";

import Link from "next/link";
import { useState } from "react";
import { useEmergencyPolling } from "@/lib/useEmergencyPolling";
import StatusBadge from "@/components/StatusBadge";

const STATUSES = ["ALL", "NEW", "ACKNOWLEDGED", "CONTACTED", "DISPATCHED", "RESOLVED", "CANCELLED"];

export default function EmergenciesPage() {
  const { emergencies, loading, error } = useEmergencyPolling(5000);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? emergencies : emergencies.filter((e) => e.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Emergencies</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === s ? "bg-brand-800 text-white" : "bg-white text-brand-800 border border-border-subtle"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-alert-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-sand text-xs uppercase text-brand-800/60">
            <tr>
              <th className="p-3">ID</th>
              <th className="hidden p-3 sm:table-cell">Created</th>
              <th className="p-3">Status</th>
              <th className="hidden p-3 md:table-cell">Location</th>
              <th className="hidden p-3 lg:table-cell">Claimed by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filtered.map((e) => (
              <tr key={e.id} className="cursor-pointer hover:bg-accent-sand" onClick={() => (window.location.href = `/admin/emergencies/${e.id}`)}>
                <td className="p-3 font-mono font-medium text-brand-900">{e.displayId}</td>
                <td className="hidden p-3 text-brand-800/70 sm:table-cell">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="p-3"><StatusBadge status={e.status} /></td>
                <td className="hidden p-3 text-brand-800/70 md:table-cell">{e.latitude ? "Available" : "Not shared"}</td>
                <td className="hidden p-3 text-brand-800/70 lg:table-cell">{e.claimedBy?.name ?? "—"}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-brand-800/60">No emergencies match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
