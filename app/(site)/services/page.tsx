export default function ServicesPage() {
  const services = [
    { title: "Emergency Ambulance", desc: "24/7 rapid response for life-threatening emergencies." },
    { title: "Patient Transportation", desc: "Assisted transport for scheduled appointments and transfers." },
    { title: "Hospital Transfer", desc: "Inter-facility transfers with medical staff on board." },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-900">Our Services</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {services.map((s) => (
          <div key={s.title} className="rounded-xl border border-border-subtle bg-white p-6">
            <h2 className="font-semibold text-brand-900">{s.title}</h2>
            <p className="mt-2 text-sm text-brand-800/80">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
