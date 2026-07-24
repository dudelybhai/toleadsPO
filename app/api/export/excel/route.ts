import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError } from "@/lib/api/response";
import { styleSheet } from "@/lib/excel";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth();
    const [purchases, salaries, sales] = await prisma.$transaction([
      prisma.purchase.findMany({ where: { deletedAt: null }, orderBy: { date: "asc" } }),
      prisma.salaryEntry.findMany({ where: { deletedAt: null }, orderBy: { date: "asc" } }),
      prisma.saleEntry.findMany({ where: { deletedAt: null }, orderBy: { date: "asc" } })
    ]);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Toleads PO Dashboard";
    workbook.created = new Date();

    const purchaseSheet = workbook.addWorksheet("Purchases");
    purchaseSheet.addRow([
      "Purchase ID", "Date", "Supplier", "Category", "Item Name", "Quantity",
      "Unit", "Amount", "Payment Method", "Shift", "Remarks", "Created At"
    ]);
    purchases.forEach((item) =>
      purchaseSheet.addRow([
        item.externalId ?? item.id, item.date, item.supplierName, item.category,
        item.itemName, Number(item.quantity), item.unit, Number(item.amount),
        item.paymentMethod, item.shift, item.remarks, item.createdAt
      ])
    );
    styleSheet(purchaseSheet, [16, 13, 24, 20, 24, 12, 12, 14, 18, 12, 60, 22]);

    const salarySheet = workbook.addWorksheet("Salaries");
    salarySheet.addRow([
      "Salary ID", "Date", "Staff Name", "Cost Type", "Amount",
      "Payment Method", "Shift", "Remarks", "Created At"
    ]);
    salaries.forEach((item) =>
      salarySheet.addRow([
        item.externalId ?? item.id, item.date, item.staffName, item.costType,
        Number(item.amount), item.paymentMethod, item.shift, item.remarks, item.createdAt
      ])
    );
    styleSheet(salarySheet, [16, 13, 22, 22, 14, 18, 12, 60, 22]);

    const salesSheet = workbook.addWorksheet("Sales");
    salesSheet.addRow(["Sale ID", "Date", "Shift", "Amount", "Source", "Remarks", "Created At"]);
    sales.forEach((item) =>
      salesSheet.addRow([
        item.externalId ?? item.id, item.date, item.shift, Number(item.amount),
        item.source, item.remarks, item.createdAt
      ])
    );
    styleSheet(salesSheet, [16, 13, 12, 14, 35, 50, 22]);

    [purchaseSheet, salarySheet, salesSheet].forEach((sheet) => {
      sheet.getColumn(2).numFmt = "yyyy-mm-dd";
      sheet.getColumn(sheet.name === "Purchases" ? 8 : sheet.name === "Salaries" ? 5 : 4).numFmt =
        "$#,##0.00";
      sheet.getColumn(sheet.columnCount).numFmt = "yyyy-mm-dd hh:mm:ss";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="Toleads_Accounts_Export.xlsx"'
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
