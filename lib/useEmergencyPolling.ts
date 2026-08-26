"use client";

import { useEffect, useRef, useState } from "react";

export type Emergency = {
  id: string;
  displayId: string;
  status: "NEW" | "ACKNOWLEDGED" | "CONTACTED" | "DISPATCHED" | "RESOLVED" | "CANCELLED";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  callerPhone: string | null;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  claimedBy?: { name: string } | null;
  assignedVehicle?: { internalCode: string; registrationNumber: string } | null;
  assignedDriver?: { fullName: string; phone: string } | null;
  assignedStaff?: { fullName: string; phone: string } | null;
};

/**
 * Polls GET /api/emergencies on an interval. Chosen over a WebSocket for
 * this deployment size — no reconnect/auth-over-socket complexity, and a
 * few seconds of latency here doesn't matter because the caller's phone
 * call to the control room is the actual time-critical path, independent
 * of this dashboard.
 */
export function useEmergencyPolling(intervalMs = 5000) {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchOnce() {
    try {
      const res = await fetch("/api/emergencies", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load emergencies");
      const data = await res.json();
      setEmergencies(data.emergencies);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load emergencies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOnce();
    timer.current = setInterval(fetchOnce, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { emergencies, loading, error, refresh: fetchOnce };
}
