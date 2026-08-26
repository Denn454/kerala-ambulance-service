"use client";

// Small localStorage-backed queue so a submission survives a dropped
// connection (common on rural 3G/4G). The phone call to the control room
// is never gated on any of this — this only covers the supplementary
// "send my location to the admin" path.

export type QueuedEmergency = {
  clientRequestId: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
  createdAt: number;
};

const KEY = "ambulance_emergency_queue_v1";

function readQueue(): QueuedEmergency[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedEmergency[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueue(item: QueuedEmergency) {
  const q = readQueue();
  q.push(item);
  writeQueue(q);
}

export function dequeue(clientRequestId: string) {
  writeQueue(readQueue().filter((i) => i.clientRequestId !== clientRequestId));
}

export function newRequestId() {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Attempts to submit an emergency, with exponential backoff retries. */
export async function submitWithRetry(
  item: QueuedEmergency,
  onAttempt?: (attempt: number) => void
): Promise<{ ok: true; displayId: string } | { ok: false }> {
  enqueue(item);
  const delays = [0, 2000, 5000, 15000, 30000];

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) await new Promise((r) => setTimeout(r, delays[attempt]));
    onAttempt?.(attempt);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        dequeue(item.clientRequestId);
        return { ok: true, displayId: data.emergency.displayId };
      }
    } catch {
      // network error or timeout — fall through to retry
    }
  }
  return { ok: false };
}

/** Call on page load / online event to flush anything stuck from a previous session. */
export async function retryQueuedEmergencies() {
  const q = readQueue();
  for (const item of q) {
    await submitWithRetry(item);
  }
}
