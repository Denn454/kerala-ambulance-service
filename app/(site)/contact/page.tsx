import { prisma } from "@/lib/prisma";

export default async function ContactPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const phone = settings?.controlRoomPhone ?? "+91XXXXXXXXXX";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-900">Contact</h1>

      <div className="mt-6 rounded-xl border-2 border-alert-600 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-alert-600">Emergency Control Room</p>
        <a href={`tel:${phone}`} className="mt-1 block text-2xl font-bold text-brand-900">
          {phone}
        </a>
        <p className="mt-1 text-sm text-brand-800/70">Available 24/7 for emergencies.</p>
      </div>

      <div className="mt-8 rounded-xl border border-border-subtle bg-white p-6">
        <p className="text-sm font-semibold text-brand-900">General Office</p>
        <p className="mt-1 text-sm text-brand-800/70">Office contact details — configure in Admin → Settings.</p>
      </div>
    </div>
  );
}
