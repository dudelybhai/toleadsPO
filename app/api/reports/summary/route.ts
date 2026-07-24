import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { dateWhere } from "@/lib/api/query";
import { apiError, serialize } from "@/lib/api/response";
import { listQuerySchema } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const query = listQuerySchema.pick({ from: true, to: true }).parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    const common = { deletedAt: null, date: dateWhere(query.from, query.to) };
    const [purchases, salaries, sales, expenses, categoryTotals, paymentTotals] =
      await prisma.$transaction([
        prisma.purchase.aggregate({ where: common, _sum: { amount: true }, _count: true }),
        prisma.salaryEntry.aggregate({ where: common, _sum: { amount: true }, _count: true }),
        prisma.saleEntry.aggregate({ where: common, _sum: { amount: true }, _count: true }),
        prisma.expense.aggregate({ where: common, _sum: { amount: true }, _count: true }),
        prisma.purchase.groupBy({
          by: ["category"],
          where: common,
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: "desc" } }
        }),
        prisma.purchase.groupBy({
          by: ["paymentMethod"],
          where: common,
          _sum: { amount: true },
          _count: true,
          orderBy: { paymentMethod: "asc" }
        })
      ]);
    const purchaseTotal = Number(purchases._sum.amount ?? 0);
    const salaryTotal = Number(salaries._sum.amount ?? 0);
    const salesTotal = Number(sales._sum.amount ?? 0);
    const otherExpenseTotal = Number(expenses._sum.amount ?? 0);

    return NextResponse.json(
      serialize({
        totals: {
          purchases: purchaseTotal,
          salaries: salaryTotal,
          sales: salesTotal,
          otherExpenses: otherExpenseTotal,
          netOperatingAmount:
            salesTotal - purchaseTotal - salaryTotal - otherExpenseTotal
        },
        counts: {
          purchases: purchases._count,
          salaries: salaries._count,
          sales: sales._count,
          otherExpenses: expenses._count
        },
        categoryTotals,
        paymentTotals
      })
    );
  } catch (error) {
    return apiError(error);
  }
}
