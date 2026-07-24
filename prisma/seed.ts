import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.accountingPeriod.upsert({
    where: { id: "period-2026-07" },
    update: {},
    create: {
      id: "period-2026-07",
      name: "Accounts from July 2026",
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      isOpen: true
    }
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
