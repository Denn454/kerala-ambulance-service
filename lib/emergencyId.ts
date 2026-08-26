import { prisma } from "./prisma";

/**
 * Generates a human-readable, sequential-looking emergency ID per year,
 * e.g. EMG-2026-000001. The backend is always the authority for this ID —
 * clients never generate or supply it.
 */
export async function nextEmergencyDisplayId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EMG-${year}-`;

  const count = await prisma.emergencyRequest.count({
    where: { displayId: { startsWith: prefix } },
  });

  const seq = String(count + 1).padStart(6, "0");
  const candidate = `${prefix}${seq}`;

  // Extremely unlikely collision guard (concurrent requests in the same instant)
  const exists = await prisma.emergencyRequest.findUnique({ where: { displayId: candidate } });
  if (exists) {
    return `${prefix}${String(count + 1 + Math.floor(Math.random() * 100)).padStart(6, "0")}`;
  }
  return candidate;
}
