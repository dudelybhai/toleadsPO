import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, requireAuth } from "@/lib/api/auth";
import { auditJson, findOpenPeriod, toDbDate } from "@/lib/api/database";
import { apiError } from "@/lib/api/response";
import {
  purchaseSchema,
  salarySchema,
  saleSchema,
  type PurchaseInput,
  type SalaryInput,
  type SaleInput
} from "@/lib/api/validation";
import { sheetRows } from "@/lib/excel";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RowError = {
  sheet: string;
  row: number;
  message: string;
};

function field(row: Record<string, string>, name: string) {
  return row[name.toLowerCase()] ?? "";
}

function validationMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
  }
  return error instanceof Error ? error.message : "Invalid row.";
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(["admin", "accountant"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Attach an Excel file using the 'file' field.");
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      throw new ApiError(415, "Only .xlsx files are supported.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new ApiError(413, "Excel file must be 10 MB or smaller.");
    }

    const workbook = new ExcelJS.Workbook();
    const fileBuffer = Buffer.from(await file.arrayBuffer()) as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];
    await workbook.xlsx.load(fileBuffer);
    const purchaseRows = sheetRows(
      workbook.getWorksheet("Purchases") ??
        workbook.getWorksheet("Purchase Master Data")
    );
    const salaryRows = sheetRows(workbook.getWorksheet("Salaries"));
    const salesRows = sheetRows(workbook.getWorksheet("Sales"));

    if (!purchaseRows.length && !salaryRows.length && !salesRows.length) {
      throw new ApiError(422, "The workbook contains no data rows.");
    }

    const errors: RowError[] = [];
    const purchases: PurchaseInput[] = [];
    const salaries: SalaryInput[] = [];
    const sales: SaleInput[] = [];

    purchaseRows.forEach((row, index) => {
      try {
        purchases.push(
          purchaseSchema.parse({
            externalId: field(row, "Purchase ID") || undefined,
            date: field(row, "Date"),
            supplier: field(row, "Supplier"),
            category: field(row, "Category"),
            itemName: field(row, "Item Name"),
            quantity: field(row, "Quantity"),
            unit: field(row, "Unit"),
            amount: field(row, "Amount"),
            paymentMethod: field(row, "Payment Method"),
            shift: field(row, "Shift"),
            remarks: field(row, "Remarks"),
            source: "EXCEL"
          })
        );
      } catch (error) {
        errors.push({
          sheet: "Purchases",
          row: index + 2,
          message: validationMessage(error)
        });
      }
    });

    salaryRows.forEach((row, index) => {
      try {
        salaries.push(
          salarySchema.parse({
            externalId: field(row, "Salary ID") || undefined,
            date: field(row, "Date"),
            staffName: field(row, "Staff Name"),
            costType: field(row, "Cost Type"),
            amount: field(row, "Amount"),
            paymentMethod: field(row, "Payment Method"),
            shift: field(row, "Shift"),
            remarks: field(row, "Remarks"),
            source: "EXCEL"
          })
        );
      } catch (error) {
        errors.push({
          sheet: "Salaries",
          row: index + 2,
          message: validationMessage(error)
        });
      }
    });

    salesRows.forEach((row, index) => {
      try {
        sales.push(
          saleSchema.parse({
            externalId: field(row, "Sale ID") || undefined,
            date: field(row, "Date"),
            shift: field(row, "Shift"),
            amount: field(row, "Amount"),
            source: field(row, "Source") || "EXCEL",
            remarks: field(row, "Remarks")
          })
        );
      } catch (error) {
        errors.push({
          sheet: "Sales",
          row: index + 2,
          message: validationMessage(error)
        });
      }
    });

    const externalIds = [
      ...purchases.map((row) => row.externalId),
      ...salaries.map((row) => row.externalId),
      ...sales.map((row) => row.externalId)
    ].filter(Boolean) as string[];
    const duplicateIds = externalIds.filter(
      (id, index) => externalIds.indexOf(id) !== index
    );
    if (duplicateIds.length) {
      errors.push({
        sheet: "Workbook",
        row: 0,
        message: `Duplicate IDs: ${Array.from(new Set(duplicateIds)).join(", ")}`
      });
    }

    if (errors.length) {
      throw new ApiError(422, "Excel validation failed. No rows were imported.", errors);
    }

    const batch = await prisma.importBatch.create({
      data: { filename: file.name, createdBy: actor.userId }
    });

    try {
      await prisma.$transaction(
        async (tx) => {
          for (const input of purchases) {
            const date = toDbDate(input.date);
            const period = await findOpenPeriod(tx, date);
            const supplier = await tx.supplier.upsert({
              where: { name: input.supplier },
              update: { deletedAt: null },
              create: { name: input.supplier }
            });
            await tx.purchase.create({
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
                source: "EXCEL",
                accountingPeriodId: period.id,
                importBatchId: batch.id,
                createdBy: actor.userId,
                updatedBy: actor.userId
              }
            });
          }
          for (const input of salaries) {
            const date = toDbDate(input.date);
            const period = await findOpenPeriod(tx, date);
            await tx.salaryEntry.create({
              data: {
                ...input,
                externalId: input.externalId || null,
                date,
                source: "EXCEL",
                accountingPeriodId: period.id,
                importBatchId: batch.id,
                createdBy: actor.userId,
                updatedBy: actor.userId
              }
            });
          }
          for (const input of sales) {
            const date = toDbDate(input.date);
            const period = await findOpenPeriod(tx, date);
            await tx.saleEntry.create({
              data: {
                ...input,
                externalId: input.externalId || null,
                date,
                accountingPeriodId: period.id,
                importBatchId: batch.id,
                createdBy: actor.userId,
                updatedBy: actor.userId
              }
            });
          }
          await tx.importBatch.update({
            where: { id: batch.id },
            data: {
              status: "COMPLETED",
              purchaseRows: purchases.length,
              salaryRows: salaries.length,
              salesRows: sales.length,
              completedAt: new Date()
            }
          });
          await tx.auditLog.create({
            data: {
              entityType: "ImportBatch",
              entityId: batch.id,
              action: "IMPORT",
              actorId: actor.userId,
              after: auditJson({
                filename: file.name,
                purchases: purchases.length,
                salaries: salaries.length,
                sales: sales.length
              })
            }
          });
        },
        { timeout: 60_000 }
      );
    } catch (error) {
      await prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: "FAILED",
          errorRows: 1,
          errors: auditJson({ message: validationMessage(error) }),
          completedAt: new Date()
        }
      });
      throw error;
    }

    return NextResponse.json(
      {
        batchId: batch.id,
        imported: {
          purchases: purchases.length,
          salaries: salaries.length,
          sales: sales.length
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
