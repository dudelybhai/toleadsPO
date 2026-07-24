import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { auditJson, findOpenPeriod, toDbDate } from "@/lib/api/database";
import { apiError, serialize } from "@/lib/api/response";
import { expenseSchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.expense.findFirstOrThrow({
      where: { id, deletedAt: null }
    });
    return NextResponse.json(serialize(item));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAuth(["admin", "accountant"]);
    const { id } = await params;
    const input = expenseSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const before = await tx.expense.findFirstOrThrow({
        where: { id, deletedAt: null }
      });
      const date = toDbDate(input.date);
      const period = await findOpenPeriod(tx, date);
      const after = await tx.expense.update({
        where: { id },
        data: {
          ...input,
          externalId: input.externalId || null,
          date,
          accountingPeriodId: period.id,
          updatedBy: actor.userId
        }
      });
      await tx.auditLog.create({
        data: {
          entityType: "Expense",
          entityId: after.id,
          action: "UPDATE",
          actorId: actor.userId,
          before: auditJson(before),
          after: auditJson(after)
        }
      });
      return after;
    });
    return NextResponse.json(serialize(item));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAuth(["admin"]);
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      const before = await tx.expense.findFirstOrThrow({
        where: { id, deletedAt: null }
      });
      const after = await tx.expense.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: actor.userId }
      });
      await tx.auditLog.create({
        data: {
          entityType: "Expense",
          entityId: after.id,
          action: "DELETE",
          actorId: actor.userId,
          before: auditJson(before),
          after: auditJson(after)
        }
      });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
