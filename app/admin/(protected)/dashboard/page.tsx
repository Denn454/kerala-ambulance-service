"use client";

import Link from "next/link";
import { useEmergencyPolling } from "@/lib/useEmergencyPolling";
import StatusBadge from "@/components/StatusBadge";

const ACTIVE = ["NEW", "ACKNOWLEDGED", "CONTACTED", "DISPATCHED"];

export default function DashboardPage() {
  const { emergencies, loading, error } = useEmergencyPolling(5000);

  const active = emergencies.filter((e) => ACTIVE.includes(e.status));
  const recent = emergencies.slice(0, 8);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Active Emergencies" value={active.length} highlight />
        <Stat label="New (unacknowledged)" value={emergencies.filter((e) => e.status === "NEW").length} highlight />
        <Stat label="Dispatched" value={emergencies.filter((e) => e.status === "DISPATCHED").length} />
        <Stat label="Resolved Today" value={emergencies.filter((e) => e.status === "RESOLVED").length} />
      </div>

      <div className="mt-8 rounded-xl border border-border-subtle bg-white">
        <div className="flex items-center justify-between border-b border-border-subtle p-4">
          <h2 className="font-semibold text-brand-900">Recent Emergencies</h2>
          <Link href="/admin/emergencies" className="text-sm font-medium text-brand-600 hover:underline">
            View all →
          </Link>
        </div>

        {loading && <p className="p-4 text-sm text-brand-800/60">Loading…</p>}
        {error && <p className="p-4 text-sm text-alert-600">{error}</p>}

        <ul className="divide-y divide-border-subtle">
          {recent.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/emergencies/${e.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-accent-sand">
                <div>
                  <p className="font-mono text-sm font-medium text-brand-900">{e.displayId}</p>
                  <p className="text-xs text-brand-800/60">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            </li>
          ))}
          {!loading && recent.length === 0 && <li className="p-4 text-sm text-brand-800/60">No emergencies yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight && value > 0 ? "border-alert-600 bg-alert-600/5" : "border-border-subtle bg-white"}`}>
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="mt-1 text-xs text-brand-800/60">{label}</p>
    </div>
  );
}
