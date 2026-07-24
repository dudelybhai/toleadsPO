import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api/auth";

export function toDbDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function findOpenPeriod(
  tx: Prisma.TransactionClient,
  date: Date
) {
  const period = await tx.accountingPeriod.findFirst({
    where: {
      isOpen: true,
      startsAt: { lte: date },
      OR: [{ endsAt: null }, { endsAt: { gte: date } }]
    },
    orderBy: { startsAt: "desc" }
  });

  if (!period) {
    throw new ApiError(422, "No open accounting period covers this date.");
  }

  return period;
}

export function auditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
