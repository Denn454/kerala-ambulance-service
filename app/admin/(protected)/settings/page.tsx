"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [controlRoomPhone, setControlRoomPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setControlRoomPhone(d.settings.controlRoomPhone);
      setOrgName(d.settings.orgName);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ controlRoomPhone, orgName }),
    });
    setSaved(true);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-brand-900">Settings</h1>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-xl border border-border-subtle bg-white p-6">
        <div>
          <label className="text-sm font-medium text-brand-900">Control Room Phone</label>
          <input
            value={controlRoomPhone}
            onChange={(e) => setControlRoomPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-brand-800/60">
            This is the number the public Emergency button dials. Changing it here updates it
            everywhere immediately — no deploy needed.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Organization Name</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">
          Save Settings
        </button>
        {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      </form>
    </div>
  );
}
