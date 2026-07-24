import { z } from "zod";

export const ACCOUNTING_START_DATE = "2026-07-01";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use date format YYYY-MM-DD.")
  .refine(
    (value) => value >= ACCOUNTING_START_DATE,
    `Date must be on or after ${ACCOUNTING_START_DATE}.`
  );

const moneySchema = z.coerce.number().finite().nonnegative().max(999999999999);
const text = (max = 255) => z.string().trim().min(1).max(max);
const remarks = z.string().trim().max(2000).default("");
const source = z.enum(["MANUAL", "EXCEL", "WHATSAPP", "PDF"]).default("MANUAL");

export const purchaseSchema = z.object({
  externalId: z.string().trim().max(100).optional().nullable(),
  date: dateSchema,
  supplier: text(),
  category: z.enum([
    "Meat",
    "Vegetables",
    "Groceries",
    "Fish",
    "Ice",
    "Plastic",
    "Chicken",
    "Malaysia Grocery",
    "Babas",
    "Gas",
    "Egg",
    "Mee",
    "Tenderfresh"
  ]),
  itemName: text(),
  quantity: z.coerce.number().positive().max(999999999),
  unit: z.enum(["entry", "kg", "pcs", "ctn", "pkt", "tray", "tank", "bag", "box"]),
  amount: moneySchema,
  paymentMethod: z.enum(["Cash", "PayNow"]),
  shift: z.enum(["7to7", "Day", "Night"]),
  remarks,
  source
});

export const salarySchema = z.object({
  externalId: z.string().trim().max(100).optional().nullable(),
  date: dateSchema,
  staffName: text(),
  costType: z.enum(["OT", "Malaysian Salary", "Advance"]),
  amount: moneySchema,
  paymentMethod: z.enum(["Cash", "PayNow"]),
  shift: z.enum(["7to7", "Day", "Night"]),
  remarks,
  source
});

export const saleSchema = z.object({
  externalId: z.string().trim().max(100).optional().nullable(),
  date: dateSchema,
  shift: z.enum(["Day", "Night"]),
  amount: moneySchema,
  source: z.string().trim().min(1).max(255).default("MANUAL"),
  remarks
});

export const expenseSchema = z.object({
  externalId: z.string().trim().max(100).optional().nullable(),
  date: dateSchema,
  category: text(),
  description: text(500),
  payee: text(),
  amount: moneySchema,
  paymentMethod: z.enum(["Cash", "PayNow"]),
  shift: z.enum(["7to7", "Day", "Night"]),
  remarks,
  source
});

export const supplierSchema = z.object({
  name: text(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  search: z.string().trim().max(255).optional(),
  shift: z.string().trim().max(50).optional()
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type SalaryInput = z.infer<typeof salarySchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
