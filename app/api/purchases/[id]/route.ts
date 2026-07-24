import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { auditJson, findOpenPeriod, toDbDate } from "@/lib/api/database";
import { apiError, serialize } from "@/lib/api/response";
import { purchaseSchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.purchase.findFirstOrThrow({
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
    const input = purchaseSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const before = await tx.purchase.findFirstOrThrow({
        where: { id, deletedAt: null }
      });
      const date = toDbDate(input.date);
      const period = await findOpenPeriod(tx, date);
      const supplier = await tx.supplier.upsert({
        where: { name: input.supplier },
        update: { deletedAt: null },
        create: { name: input.supplier }
      });
      const after = await tx.purchase.update({
        where: { id },
        data: {
          externalId: input.externalId || null,
          date,
          supplierName: input.supplier,
          supplierId: supplier.id,
          category: input.category,
          itemName: input.itemName,
          quantity: input.quantity,
          unit: input.unit,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          shift: input.shift,
          remarks: input.remarks,
          source: input.source,
          accountingPeriodId: period.id,
          updatedBy: actor.userId
        }
      });
      await tx.auditLog.create({
        data: {
          entityType: "Purchase",
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
      const before = await tx.purchase.findFirstOrThrow({
        where: { id, deletedAt: null }
      });
      const after = await tx.purchase.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: actor.userId }
      });
      await tx.auditLog.create({
        data: {
          entityType: "Purchase",
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
