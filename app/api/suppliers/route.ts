import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/api/auth";
import { parseListQuery } from "@/lib/api/query";
import { apiError, serialize } from "@/lib/api/response";
import { supplierSchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const query = parseListQuery(request);
    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: "insensitive" } }
        : {})
    };
    const [items, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        include: {
          _count: { select: { purchases: { where: { deletedAt: null } } } }
        },
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.supplier.count({ where })
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
    const input = supplierSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({ data: input });
      await tx.auditLog.create({
        data: {
          entityType: "Supplier",
          entityId: supplier.id,
          action: "CREATE",
          actorId: actor.userId,
          after: JSON.parse(JSON.stringify(supplier))
        }
      });
      return supplier;
    });
    return NextResponse.json(serialize(item), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
