import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(6),
  qualification: z.string().optional(),
  role: z.string().optional(),
  experienceYrs: z.number().int().nonnegative().optional(),
  certification: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "INACTIVE"]).optional(),
  vehicleId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const staff = await prisma.medicalStaff.findMany({
    where: q ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }] } : undefined,
    include: { vehicle: { select: { internalCode: true } } },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  const staff = await prisma.medicalStaff.create({ data: parsed.data });
  return NextResponse.json({ staff }, { status: 201 });
}
