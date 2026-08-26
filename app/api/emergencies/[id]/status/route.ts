import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["NEW", "ACKNOWLEDGED", "CONTACTED", "DISPATCHED", "RESOLVED", "CANCELLED"]),
  note: z.string().max(1000).optional(),
  version: z.number().int().nonnegative(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { status, note, version } = parsed.data;

  const current = await prisma.emergencyRequest.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Optimistic lock: if someone else updated this record since the admin's
  // client last fetched it, reject rather than silently overwrite.
  const result = await prisma.emergencyRequest.updateMany({
    where: { id, version },
    data: { status, version: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "This emergency was just updated by another admin. Refresh to see the current state." },
      { status: 409 }
    );
  }

  await prisma.emergencyStatusHistory.create({
    data: { emergencyId: id, fromStatus: current.status, toStatus: status, note },
  });

  const updated = await prisma.emergencyRequest.findUnique({ where: { id } });
  return NextResponse.json({ emergency: updated });
}
