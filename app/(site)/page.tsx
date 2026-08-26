import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EmergencyFlow from "@/components/EmergencyFlow";

async function getControlRoomPhone() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  return settings?.controlRoomPhone ?? "+91XXXXXXXXXX";
}

const SERVICES = [
  { title: "Emergency Ambulance", desc: "Immediate response for life-threatening emergencies, dispatched from your nearest available unit." },
  { title: "Patient Transportation", desc: "Non-emergency transport for patients who need assistance getting to appointments or facilities." },
  { title: "Hospital Transfer", desc: "Inter-facility transfers with trained medical staff on board when required." },
];

export default async function HomePage() {
  const controlRoomPhone = await getControlRoomPhone();

  return (
    <div>
      <section className="bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/60">24/7 Emergency Response</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            When every second matters, we are ready to respond.
          </h1>
          <p className="mt-5 max-w-xl text-white/70">
            Serving all 14 districts of Kerala with trained drivers, medical staff, and a control
            room that answers around the clock.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <EmergencyFlow controlRoomPhone={controlRoomPhone} />
            <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10">
              Our Services
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-brand-900">Services</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-xl border border-border-subtle bg-white p-6">
              <h3 className="font-semibold text-brand-900">{s.title}</h3>
              <p className="mt-2 text-sm text-brand-800/80">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-accent-sand">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-brand-900">In an emergency, every second counts</h2>
          <p className="mt-3 max-w-2xl text-brand-800/80">
            Tap the emergency button to call our control room directly and share your location with
            our dispatch team — the call works even if your connection is weak.
          </p>
          <div className="mt-6">
            <EmergencyFlow controlRoomPhone={controlRoomPhone} />
          </div>
        </div>
      </section>
    </div>
  );
}
