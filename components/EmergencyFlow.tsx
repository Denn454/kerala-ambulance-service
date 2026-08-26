"use client";

import { useEffect, useRef, useState } from "react";
import { newRequestId, submitWithRetry, retryQueuedEmergencies } from "@/lib/emergencyQueue";

type FlowState =
  | "idle"
  | "call_initiated"
  | "location_requested"
  | "location_received"
  | "location_denied"
  | "submitting"
  | "submitted"
  | "failed";

export default function EmergencyFlow({ controlRoomPhone }: { controlRoomPhone: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FlowState>("idle");
  const [displayId, setDisplayId] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Flush anything queued from a previous flaky-connection session.
    retryQueuedEmergencies();
    const onOnline = () => retryQueuedEmergencies();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  function startEmergency() {
    setOpen(true);
    setState("call_initiated");
    // Dial immediately and independently of anything below — this must
    // work even if the network/backend is completely unavailable.
    window.location.href = `tel:${controlRoomPhone}`;
  }

  function shareLocation() {
    setState("location_requested");
    if (!("geolocation" in navigator)) {
      setState("location_denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState("location_received");
        void submit(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => setState("location_denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function shareWithoutLocation() {
    void submit(undefined, undefined, undefined);
  }

  async function submit(latitude?: number, longitude?: number, accuracy?: number) {
    setState("submitting");
    requestIdRef.current = newRequestId();
    const result = await submitWithRetry({
      clientRequestId: requestIdRef.current,
      latitude,
      longitude,
      accuracy,
      createdAt: Date.now(),
    });
    if (result.ok) {
      setDisplayId(result.displayId);
      setState("submitted");
    } else {
      setState("failed");
    }
  }

  function reset() {
    setOpen(false);
    setState("idle");
    setDisplayId(null);
  }

  return (
    <>
      <button
        onClick={startEmergency}
        className="pulse-ring relative inline-flex items-center gap-2 rounded-full bg-alert-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-alert-700/20 transition hover:bg-alert-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert-700 active:scale-[0.98]"
        aria-haspopup="dialog"
      >
        <span aria-hidden>🚨</span> Emergency — Call Now
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Emergency assistance"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-brand-950/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-brand-900">Emergency assistance</h2>

            {state === "call_initiated" && (
              <div className="mt-3 space-y-4">
                <p className="text-sm text-brand-800">
                  We&apos;re connecting you to the control room at{" "}
                  <span className="font-semibold">{controlRoomPhone}</span>. If the call didn&apos;t
                  start automatically, tap below.
                </p>
                <a
                  href={`tel:${controlRoomPhone}`}
                  className="block w-full rounded-lg bg-alert-600 px-4 py-3 text-center font-semibold text-white hover:bg-alert-700"
                >
                  📞 Call Control Room
                </a>
                <div className="rounded-lg bg-accent-sand p-4">
                  <p className="text-sm text-brand-800">
                    Your location can help our emergency team reach you faster.
                  </p>
                  <button
                    onClick={shareLocation}
                    className="mt-3 w-full rounded-lg border border-brand-700 px-4 py-2.5 font-medium text-brand-800 hover:bg-brand-700 hover:text-white"
                  >
                    Share My Location
                  </button>
                </div>
              </div>
            )}

            {state === "location_requested" && (
              <p className="mt-4 text-sm text-brand-800">Requesting your location…</p>
            )}

            {(state === "location_received" || state === "submitting") && (
              <p className="mt-4 text-sm text-brand-800">Sending your location to our team…</p>
            )}

            {state === "location_denied" && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-brand-800">
                  We could not access your location. Please stay on the call with the control room
                  and describe your location to them directly.
                </p>
                <button
                  onClick={shareWithoutLocation}
                  className="w-full rounded-lg border border-brand-700 px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-700 hover:text-white"
                >
                  Notify admin without location
                </button>
              </div>
            )}

            {state === "submitted" && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-brand-900">Request submitted.</p>
                <p className="text-sm text-brand-800">
                  Reference ID: <span className="font-mono">{displayId}</span>. Please stay on the
                  line with the control room — our admin team has also been notified.
                </p>
              </div>
            )}

            {state === "failed" && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-brand-800">
                  We couldn&apos;t confirm your request reached our team over this connection. Please
                  make sure you&apos;re still on the call with the control room — that connection
                  works independently of this website. We&apos;ll keep trying to send your location
                  in the background.
                </p>
              </div>
            )}

            <button
              onClick={reset}
              className="mt-6 w-full text-center text-sm text-brand-600 underline underline-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
