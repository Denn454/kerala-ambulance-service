import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

async function getControlRoomPhone() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  return settings?.controlRoomPhone ?? "+91XXXXXXXXXX";
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const controlRoomPhone = await getControlRoomPhone();
  return (
    <>
      <SiteHeader controlRoomPhone={controlRoomPhone} />
      <main className="flex-1">{children}</main>
      <SiteFooter controlRoomPhone={controlRoomPhone} />
    </>
  );
}
