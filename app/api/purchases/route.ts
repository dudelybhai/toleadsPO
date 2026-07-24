import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/api/auth";
import { findOpenPeriod, auditJson, toDbDate } from "@/lib/api/database";
import { dateWhere, parseListQuery } from "@/lib/api/query";
import { apiError, serialize } from "@/lib/api/response";
import { purchaseSchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const query = parseListQuery(request);
    const where: Prisma.PurchaseWhereInput = {
      deletedAt: null,
      date: dateWhere(query.from, query.to),
      ...(query.shift ? { shift: query.shift } : {}),
      ...(query.search
        ? {
            OR: [
              { supplierName: { contains: query.search, mode: "insensitive" } },
              { itemName: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {})
    };
    const [items, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.purchase.count({ where })
    ]);
    return NextResponse.json(
      serialize({ items, total, page: query.page, pageSize: query.pageSize })
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(["admin", "accountant"]);
    const input = purchaseSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const date = toDbDate(input.date);
      const period = await findOpenPeriod(tx, date);
      const supplier = await tx.supplier.upsert({
        where: { name: input.supplier },
        update: { deletedAt: null },
        create: { name: input.supplier }
      });
      const created = await tx.purchase.create({
        data: {
          externalId: input.externalId || null,
          date,
          category: input.category,
          itemName: input.itemName,
          supplierName: input.supplier,
          supplierId: supplier.id,
          quantity: input.quantity,
          unit: input.unit,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          shift: input.shift,
          remarks: input.remarks,
          source: input.source,
          accountingPeriodId: period.id,
          createdBy: actor.userId,
          updatedBy: actor.userId
        }
      });
      await tx.auditLog.create({
        data: {
          entityType: "Purchase",
          entityId: created.id,
          action: "CREATE",
          actorId: actor.userId,
          after: auditJson(created)
        }
      });
      return created;
    });
    return NextResponse.json(serialize(item), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
