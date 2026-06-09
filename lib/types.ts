export const categories = [
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
] as const;

export const staffCostTypes = ["OT", "Malaysian Salary", "Advance"] as const;
export const paymentMethods = ["Cash", "PayNow"] as const;
export const shiftTypes = ["7to7", "Day", "Night"] as const;
export const units = [
  "entry",
  "kg",
  "pcs",
  "ctn",
  "pkt",
  "tray",
  "tank",
  "bag",
  "box"
] as const;

export type Category = (typeof categories)[number];
export type StaffCostType = (typeof staffCostTypes)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type ShiftType = (typeof shiftTypes)[number];
export type Unit = (typeof units)[number];

export type PurchaseEntry = {
  id: string;
  date: string;
  category: Category;
  itemName: string;
  supplier: string;
  quantity: number;
  unit: Unit;
  amount: number;
  paymentMethod: PaymentMethod;
  shift: ShiftType;
  remarks: string;
  createdAt: string;
};

export type SalaryEntry = {
  id: string;
  date: string;
  staffName: string;
  costType: StaffCostType;
  amount: number;
  paymentMethod: PaymentMethod;
  shift: ShiftType;
  remarks: string;
  createdAt: string;
};

export type SalesEntry = {
  id: string;
  date: string;
  shift: "Day" | "Night";
  amount: number;
  source: string;
  remarks: string;
  createdAt: string;
};

export type PurchaseFilters = {
  date: string;
  category: string;
  paymentMethod: string;
  shift: string;
  search: string;
};
