import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const emergency = await prisma.emergencyRequest.findUnique({
    where: { id },
    include: {
      assignedVehicle: true,
      assignedDriver: true,
      assignedStaff: true,
      claimedBy: { select: { name: true, email: true } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!emergency) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ emergency });
}
