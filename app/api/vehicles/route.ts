import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  internalCode: z.string().min(1),
  registrationNumber: z.string().min(1),
  vehicleType: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "BUSY", "MAINTENANCE", "INACTIVE"]).optional(),
  insuranceExpiry: z.string().datetime().optional(),
  fitnessExpiry: z.string().datetime().optional(),
  pucExpiry: z.string().datetime().optional(),
  driverId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const vehicles = await prisma.vehicle.findMany({
    where: q
      ? { OR: [{ internalCode: { contains: q } }, { registrationNumber: { contains: q } }] }
      : undefined,
    include: { driver: { select: { fullName: true, phone: true } } },
    orderBy: { internalCode: "asc" },
  });
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const vehicle = await prisma.vehicle.create({
    data: {
      ...d,
      insuranceExpiry: d.insuranceExpiry ? new Date(d.insuranceExpiry) : undefined,
      fitnessExpiry: d.fitnessExpiry ? new Date(d.fitnessExpiry) : undefined,
      pucExpiry: d.pucExpiry ? new Date(d.pucExpiry) : undefined,
    },
  });
  return NextResponse.json({ vehicle }, { status: 201 });
}
