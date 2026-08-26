import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Note: registrationNumber is intentionally freely editable here — the
// internalCode (AMB-001 etc.) is the stable identifier used for foreign
// keys and history; the registration plate can change without breaking
// any relationship.
const schema = z.object({
  registrationNumber: z.string().min(1).optional(),
  vehicleType: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "BUSY", "MAINTENANCE", "INACTIVE"]).optional(),
  insuranceExpiry: z.string().datetime().nullable().optional(),
  fitnessExpiry: z.string().datetime().nullable().optional(),
  pucExpiry: z.string().datetime().nullable().optional(),
  driverId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { insuranceExpiry, fitnessExpiry, pucExpiry, ...rest } = parsed.data;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...rest,
      ...(insuranceExpiry !== undefined ? { insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null } : {}),
      ...(fitnessExpiry !== undefined ? { fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null } : {}),
      ...(pucExpiry !== undefined ? { pucExpiry: pucExpiry ? new Date(pucExpiry) : null } : {}),
    },
  });
  return NextResponse.json({ vehicle });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.update({ where: { id }, data: { status: "INACTIVE" } });
  return NextResponse.json({ vehicle });
}
