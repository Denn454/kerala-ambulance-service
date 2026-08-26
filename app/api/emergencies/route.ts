import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextEmergencyDisplayId } from "@/lib/emergencyId";
import { z } from "zod";

const createSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().nonnegative().optional(),
  callerPhone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  // Client-generated idempotency key from the offline-retry queue.
  // NOT the authoritative emergency ID — that is always assigned below.
  clientRequestId: z.string().min(8).max(100),
});

/**
 * GET /api/emergencies — admin-only (enforced by middleware).
 * Polled by the admin dashboard every few seconds instead of a WebSocket:
 * far fewer moving parts to get wrong for a small deployment, at the cost
 * of a few seconds of latency, which is acceptable given the phone call
 * to the control room is the actual time-critical path.
 */
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const emergencies = await prisma.emergencyRequest.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      assignedVehicle: { select: { internalCode: true, registrationNumber: true } },
      assignedDriver: { select: { fullName: true, phone: true } },
      assignedStaff: { select: { fullName: true, phone: true } },
      claimedBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ emergencies });
}

/**
 * POST /api/emergencies — public. This is what the emergency button submits
 * after capturing (or failing to capture) the caller's location. The phone
 * call to the control room happens independently on the client and is
 * NEVER blocked by this request.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Idempotent on clientRequestId: a retried submission (e.g. after a
  // flaky-network timeout where the first attempt actually succeeded)
  // returns the existing record instead of creating a duplicate.
  const existing = await prisma.emergencyRequest.findUnique({
    where: { clientRequestId: data.clientRequestId },
  });
  if (existing) {
    return NextResponse.json({ emergency: existing }, { status: 200 });
  }

  const displayId = await nextEmergencyDisplayId();

  const emergency = await prisma.emergencyRequest.create({
    data: {
      displayId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      callerPhone: data.callerPhone,
      notes: data.notes,
      clientRequestId: data.clientRequestId,
      status: "NEW",
      history: { create: { toStatus: "NEW", note: "Emergency request submitted" } },
    },
  });

  return NextResponse.json({ emergency }, { status: 201 });
}
