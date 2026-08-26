import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  qualification: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  experienceYrs: z.number().int().nonnegative().nullable().optional(),
  certification: z.string().nullable().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "INACTIVE"]).optional(),
  vehicleId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const staff = await prisma.medicalStaff.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ staff });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.medicalStaff.update({ where: { id }, data: { status: "INACTIVE" } });
  return NextResponse.json({ staff });
}
