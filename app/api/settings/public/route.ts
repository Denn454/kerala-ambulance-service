import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: exposes ONLY the control-room phone number, never anything else
// from Settings. The emergency button reads this so the number is never
// hardcoded in client code and can be changed by an admin without a deploy.
export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({
    controlRoomPhone: settings?.controlRoomPhone ?? "+91XXXXXXXXXX",
    orgName: settings?.orgName ?? "Kerala Emergency Ambulance Service",
  });
}
