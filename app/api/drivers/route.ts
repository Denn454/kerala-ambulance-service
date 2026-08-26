import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(6),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime().optional(),
  experienceYrs: z.number().int().nonnegative().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "INACTIVE"]).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const drivers = await prisma.driver.findMany({
    where: q
      ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }, { licenseNumber: { contains: q } }] }
      : undefined,
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ drivers });
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const driver = await prisma.driver.create({
    data: { ...data, licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined },
  });
  return NextResponse.json({ driver }, { status: 201 });
}
