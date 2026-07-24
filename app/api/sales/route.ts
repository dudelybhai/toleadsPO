import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/api/auth";
import { auditJson, findOpenPeriod, toDbDate } from "@/lib/api/database";
import { dateWhere, parseListQuery } from "@/lib/api/query";
import { apiError, serialize } from "@/lib/api/response";
import { saleSchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const query = parseListQuery(request);
    const where: Prisma.SaleEntryWhereInput = {
      deletedAt: null,
      date: dateWhere(query.from, query.to),
      ...(query.shift ? { shift: query.shift } : {})
    };
    const [items, total] = await prisma.$transaction([
      prisma.saleEntry.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.saleEntry.count({ where })
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
    const input = saleSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const date = toDbDate(input.date);
      const period = await findOpenPeriod(tx, date);
      const created = await tx.saleEntry.create({
        data: {
          ...input,
          externalId: input.externalId || null,
          date,
          accountingPeriodId: period.id,
          createdBy: actor.userId,
          updatedBy: actor.userId
        }
      });
      await tx.auditLog.create({
        data: {
          entityType: "SaleEntry",
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
