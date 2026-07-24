import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { auditJson } from "@/lib/api/database";
import { apiError, serialize } from "@/lib/api/response";
import { supplierSchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAuth(["admin", "accountant"]);
    const { id } = await params;
    const input = supplierSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const before = await tx.supplier.findFirstOrThrow({
        where: { id, deletedAt: null }
      });
      const after = await tx.supplier.update({
        where: { id },
        data: input
      });
      await tx.auditLog.create({
        data: {
          entityType: "Supplier",
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
      const before = await tx.supplier.findFirstOrThrow({
        where: { id, deletedAt: null }
      });
      const after = await tx.supplier.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      await tx.auditLog.create({
        data: {
          entityType: "Supplier",
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
