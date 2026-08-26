import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.admin.create({
      data: { name: "Control Room Admin", email, passwordHash, role: "SUPERADMIN" },
    });
    console.log(`Created admin: ${email} / ${password}  (CHANGE THIS PASSWORD)`);
  } else {
    console.log(`Admin ${email} already exists — skipped.`);
  }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      controlRoomPhone: process.env.CONTROL_ROOM_PHONE || "+91XXXXXXXXXX",
      orgName: "Kerala Emergency Ambulance Service",
    },
    update: {},
  });
  console.log("Settings ensured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
