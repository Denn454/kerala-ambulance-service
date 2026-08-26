"use client";

import Link from "next/link";
import { useState } from "react";
import EmergencyFlow from "./EmergencyFlow";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({ controlRoomPhone }: { controlRoomPhone: string }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-bold text-brand-900">
          Kerala Emergency <span className="text-brand-600">Ambulance</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-brand-800 hover:text-brand-600">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <EmergencyFlow controlRoomPhone={controlRoomPhone} />
        </div>

        <button
          onClick={() => setNavOpen((v) => !v)}
          className="md:hidden rounded-md p-2 text-brand-900"
          aria-label="Toggle menu"
          aria-expanded={navOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {navOpen ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {navOpen && (
        <div className="border-t border-border-subtle px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-brand-800" onClick={() => setNavOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <EmergencyFlow controlRoomPhone={controlRoomPhone} />
          </div>
        </div>
      )}
    </header>
  );
}
