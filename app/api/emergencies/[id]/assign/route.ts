import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const ACTIVE_STATUSES = ["NEW", "ACKNOWLEDGED", "CONTACTED", "DISPATCHED"];

const schema = z.object({
  vehicleId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
  staffId: z.string().nullable().optional(),
  version: z.number().int().nonnegative(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { vehicleId, driverId, staffId, version } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.emergencyRequest.findUnique({ where: { id } });
      if (!current) throw new Error("NOT_FOUND");
      if (current.version !== version) throw new Error("CONFLICT");

      // Server-side double-booking check: reject if the vehicle/driver/staff
      // is already assigned to a *different* active emergency right now.
      // Trusting only client-side warnings here would let a race condition
      // double-book a resource mid-crisis.
      if (vehicleId) {
        const clash = await tx.emergencyRequest.findFirst({
          where: { assignedVehicleId: vehicleId, status: { in: ACTIVE_STATUSES }, NOT: { id } },
        });
        if (clash) throw new Error(`VEHICLE_BUSY:${clash.displayId}`);
      }
      if (driverId) {
        const clash = await tx.emergencyRequest.findFirst({
          where: { assignedDriverId: driverId, status: { in: ACTIVE_STATUSES }, NOT: { id } },
        });
        if (clash) throw new Error(`DRIVER_BUSY:${clash.displayId}`);
      }
      if (staffId) {
        const clash = await tx.emergencyRequest.findFirst({
          where: { assignedStaffId: staffId, status: { in: ACTIVE_STATUSES }, NOT: { id } },
        });
        if (clash) throw new Error(`STAFF_BUSY:${clash.displayId}`);
      }

      const next = await tx.emergencyRequest.update({
        where: { id },
        data: {
          assignedVehicleId: vehicleId,
          assignedDriverId: driverId,
          assignedStaffId: staffId,
          version: { increment: 1 },
          status: current.status === "NEW" || current.status === "ACKNOWLEDGED" ? "DISPATCHED" : current.status,
        },
      });

      await tx.emergencyStatusHistory.create({
        data: {
          emergencyId: id,
          fromStatus: current.status,
          toStatus: next.status,
          note: `Assignment updated by ${session.email}`,
        },
      });

      return next;
    });

    return NextResponse.json({ emergency: updated });
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (msg === "CONFLICT")
      return NextResponse.json(
        { error: "This emergency was just updated by another admin. Refresh to see the current state." },
        { status: 409 }
      );
    if (msg.startsWith("VEHICLE_BUSY"))
      return NextResponse.json({ error: `That vehicle is already active on ${msg.split(":")[1]}.` }, { status: 409 });
    if (msg.startsWith("DRIVER_BUSY"))
      return NextResponse.json({ error: `That driver is already active on ${msg.split(":")[1]}.` }, { status: 409 });
    if (msg.startsWith("STAFF_BUSY"))
      return NextResponse.json({ error: `That staff member is already active on ${msg.split(":")[1]}.` }, { status: 409 });
    return NextResponse.json({ error: "Assignment failed." }, { status: 500 });
  }
}
