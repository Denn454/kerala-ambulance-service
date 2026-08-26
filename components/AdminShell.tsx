"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/admin/emergencies", label: "Emergencies", icon: "🚨" },
  { href: "/admin/drivers", label: "Drivers", icon: "🧑‍✈️" },
  { href: "/admin/vehicles", label: "Vehicles", icon: "🚑" },
  { href: "/admin/medical-staff", label: "Medical Staff", icon: "🩺" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminShell({ adminName, children }: { adminName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const Nav = (
    <nav className="flex flex-col gap-1 p-3">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
              active ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-accent-sand"
            }`}
          >
            <span aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-white md:block">
        <div className="border-b border-border-subtle p-4">
          <p className="font-bold text-brand-900">Ambulance Admin</p>
          <p className="mt-0.5 text-xs text-brand-800/60">{adminName}</p>
        </div>
        {Nav}
        <div className="p-3">
          <button onClick={logout} className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-brand-800 hover:bg-accent-sand">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle bg-white px-4 py-3 md:hidden">
          <p className="font-bold text-brand-900">Ambulance Admin</p>
          <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" className="rounded-md p-2 text-brand-900">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </header>
        {open && (
          <div className="border-b border-border-subtle bg-white md:hidden">
            {Nav}
            <div className="p-3">
              <button onClick={logout} className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-brand-800">
                Log out
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
