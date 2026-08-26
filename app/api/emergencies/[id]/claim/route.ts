import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// A claim auto-expires after this long, so a distracted/disconnected admin
// never permanently blocks others from picking up a case.
const CLAIM_EXPIRY_MS = 10 * 60 * 1000;

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const emergency = await prisma.emergencyRequest.findUnique({ where: { id } });
  if (!emergency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const claimExpired =
    !emergency.claimedAt || Date.now() - emergency.claimedAt.getTime() > CLAIM_EXPIRY_MS;

  if (emergency.claimedById && emergency.claimedById !== session.adminId && !claimExpired) {
    // Not a hard block — surfaced to the UI as a heads-up, the admin can still take over.
    const claimer = await prisma.admin.findUnique({ where: { id: emergency.claimedById } });
    return NextResponse.json(
      { warning: `Currently being handled by ${claimer?.name ?? "another admin"}.`, emergency },
      { status: 200 }
    );
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id },
    data: {
      claimedById: session.adminId,
      claimedAt: new Date(),
      status: emergency.status === "NEW" ? "ACKNOWLEDGED" : emergency.status,
      version: { increment: 1 },
      history:
        emergency.status === "NEW"
          ? { create: { fromStatus: "NEW", toStatus: "ACKNOWLEDGED", note: `Claimed by ${session.email}` } }
          : undefined,
    },
  });

  return NextResponse.json({ emergency: updated });
}
