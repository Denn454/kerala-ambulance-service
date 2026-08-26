import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  licenseNumber: z.string().min(1).optional(),
  licenseExpiry: z.string().datetime().nullable().optional(),
  experienceYrs: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "INACTIVE"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { licenseExpiry, ...rest } = parsed.data;
  const driver = await prisma.driver.update({
    where: { id },
    data: { ...rest, ...(licenseExpiry !== undefined ? { licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null } : {}) },
  });
  return NextResponse.json({ driver });
}

// Soft-delete: mark INACTIVE rather than hard-deleting, so historical
// emergency records that reference this driver stay intact.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await prisma.driver.update({ where: { id }, data: { status: "INACTIVE" } });
  return NextResponse.json({ driver });
}
