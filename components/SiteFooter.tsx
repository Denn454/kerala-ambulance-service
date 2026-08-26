export default function SiteFooter({ controlRoomPhone }: { controlRoomPhone: string }) {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-brand-950 text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-bold text-white">Kerala Emergency Ambulance</p>
            <p className="mt-2 text-sm">24/7 emergency response across all 14 districts of Kerala.</p>
          </div>
          <div>
            <p className="font-semibold text-white">Control Room</p>
            <a href={`tel:${controlRoomPhone}`} className="mt-2 block text-sm hover:text-white">
              {controlRoomPhone}
            </a>
          </div>
          <div>
            <p className="font-semibold text-white">This is not a replacement for professional medical judgment.</p>
            <p className="mt-2 text-sm">In a life-threatening emergency, call the control room immediately.</p>
          </div>
        </div>
        <p className="mt-8 text-xs text-white/50">
          © {new Date().getFullYear()} Kerala Emergency Ambulance Service. Configure organization details in Admin → Settings.
        </p>
      </div>
    </footer>
  );
}
