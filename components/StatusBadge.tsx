const COLORS: Record<string, string> = {
  NEW: "bg-alert-600 text-white",
  ACKNOWLEDGED: "bg-amber-500 text-white",
  CONTACTED: "bg-brand-600 text-white",
  DISPATCHED: "bg-brand-700 text-white",
  RESOLVED: "bg-emerald-600 text-white",
  CANCELLED: "bg-gray-400 text-white",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] ?? "bg-gray-300"}`}>
      {status}
    </span>
  );
}
