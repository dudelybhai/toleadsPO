import purchasesJson from "@/data/purchases.json";
import salariesJson from "@/data/salaries.json";
import salesJson from "@/data/sales.json";
import type {
  PurchaseEntry,
  PurchaseFilters,
  SalaryEntry,
  SalesEntry
} from "@/lib/types";

export const initialPurchases = purchasesJson as PurchaseEntry[];
export const initialSalaries = salariesJson as SalaryEntry[];
export const initialSales = salesJson as SalesEntry[];

export function filterPurchases(
  purchases: PurchaseEntry[],
  filters: PurchaseFilters
) {
  return purchases.filter((purchase) => {
    const matchesDate = !filters.date || purchase.date === filters.date;
    const matchesCategory =
      !filters.category || purchase.category === filters.category;
    const matchesPayment =
      !filters.paymentMethod ||
      purchase.paymentMethod === filters.paymentMethod;
    const matchesShift = !filters.shift || purchase.shift === filters.shift;
    const query = filters.search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      purchase.supplier.toLowerCase().includes(query) ||
      purchase.itemName.toLowerCase().includes(query);

    return (
      matchesDate &&
      matchesCategory &&
      matchesPayment &&
      matchesShift &&
      matchesSearch
    );
  });
}

export function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function groupSalesByDate(sales: SalesEntry[]) {
  const totals = new Map<
    string,
    { date: string; day: number; night: number; amount: number }
  >();

  sales.forEach((sale) => {
    const current = totals.get(sale.date) ?? {
      date: sale.date,
      day: 0,
      night: 0,
      amount: 0
    };
    current.amount += sale.amount;
    current[sale.shift === "Day" ? "day" : "night"] += sale.amount;
    totals.set(sale.date, current);
  });

  return Array.from(totals.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function getDashboardMetrics(
  purchases: PurchaseEntry[],
  salaries: SalaryEntry[],
  sales: SalesEntry[] = []
) {
  const purchaseTotal = sumBy(purchases, (item) => item.amount);
  const cashTotal = sumBy(
    purchases.filter((item) => item.paymentMethod === "Cash"),
    (item) => item.amount
  );
  const payNowTotal = sumBy(
    purchases.filter((item) => item.paymentMethod === "PayNow"),
    (item) => item.amount
  );
  const salaryTotal = sumBy(salaries, (item) => item.amount);
  const salesTotal = sumBy(sales, (item) => item.amount);

  return {
    purchaseTotal,
    cashTotal,
    payNowTotal,
    salaryTotal,
    salesTotal,
    netOperatingAmount: salesTotal - purchaseTotal - salaryTotal
  };
}

export function groupPurchaseByCategory(purchases: PurchaseEntry[]) {
  const totals = new Map<string, number>();
  purchases.forEach((purchase) => {
    totals.set(
      purchase.category,
      (totals.get(purchase.category) ?? 0) + purchase.amount
    );
  });
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export function groupPurchaseByDate(purchases: PurchaseEntry[]) {
  const totals = new Map<string, number>();
  purchases.forEach((purchase) => {
    totals.set(purchase.date, (totals.get(purchase.date) ?? 0) + purchase.amount);
  });
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

export function groupPaymentMethod(purchases: PurchaseEntry[]) {
  return ["Cash", "PayNow"].map((method) => ({
    method,
    amount: sumBy(
      purchases.filter((purchase) => purchase.paymentMethod === method),
      (purchase) => purchase.amount
    )
  }));
}

export function groupShiftExpenses(
  purchases: PurchaseEntry[],
  salaries: SalaryEntry[]
) {
  return ["7to7", "Day", "Night"].map((shift) => ({
    shift,
    purchase: sumBy(
      purchases.filter((purchase) => purchase.shift === shift),
      (purchase) => purchase.amount
    ),
    salary: sumBy(
      salaries.filter((salary) => salary.shift === shift),
      (salary) => salary.amount
    )
  }));
}

export function getSupplierTotals(purchases: PurchaseEntry[]) {
  const totals = new Map<string, { supplier: string; amount: number; count: number }>();
  purchases.forEach((purchase) => {
    const current = totals.get(purchase.supplier) ?? {
      supplier: purchase.supplier,
      amount: 0,
      count: 0
    };
    current.amount += purchase.amount;
    current.count += 1;
    totals.set(purchase.supplier, current);
  });

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

export type SupplierSummary = {
  supplier: string;
  categories: string[];
  amount: number;
  count: number;
  averageBill: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  latestAmount: number;
  previousAmount: number | null;
  latestDifference: number | null;
};

export function getSupplierSummaries(purchases: PurchaseEntry[]) {
  const purchasesBySupplier = new Map<string, PurchaseEntry[]>();

  purchases.forEach((purchase) => {
    if (purchase.supplier === "Unitemized cash-out") {
      return;
    }

    const entries = purchasesBySupplier.get(purchase.supplier) ?? [];
    entries.push(purchase);
    purchasesBySupplier.set(purchase.supplier, entries);
  });

  return Array.from(purchasesBySupplier.entries())
    .map(([supplier, entries]): SupplierSummary => {
      const ordered = [...entries].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id)
      );
      const amount = sumBy(ordered, (purchase) => purchase.amount);
      const latest = ordered.at(-1)!;
      const previous = ordered.at(-2);

      return {
        supplier,
        categories: Array.from(
          new Set(ordered.map((purchase) => purchase.category))
        ).sort(),
        amount,
        count: ordered.length,
        averageBill: amount / ordered.length,
        firstPurchaseDate: ordered[0].date,
        lastPurchaseDate: latest.date,
        latestAmount: latest.amount,
        previousAmount: previous?.amount ?? null,
        latestDifference: previous ? latest.amount - previous.amount : null
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export type PurchaseBillChange = {
  purchase: PurchaseEntry;
  previousPurchase: PurchaseEntry;
  difference: number;
  percentageChange: number;
};

function purchaseComparisonKey(purchase: PurchaseEntry) {
  return `${purchase.category}:${purchase.itemName}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

export function getPurchaseBillChanges(purchases: PurchaseEntry[]) {
  const previousByItem = new Map<string, PurchaseEntry>();
  const changes: PurchaseBillChange[] = [];
  const ordered = [...purchases].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id)
  );

  ordered.forEach((purchase) => {
    if (purchase.itemName === "Unitemized cash-out") {
      return;
    }

    const key = purchaseComparisonKey(purchase);
    const previousPurchase = previousByItem.get(key);

    if (previousPurchase) {
      const difference = purchase.amount - previousPurchase.amount;
      changes.push({
        purchase,
        previousPurchase,
        difference,
        percentageChange:
          previousPurchase.amount === 0
            ? 0
            : (difference / previousPurchase.amount) * 100
      });
    }

    previousByItem.set(key, purchase);
  });

  return changes.sort(
    (a, b) =>
      b.purchase.date.localeCompare(a.purchase.date) ||
      b.purchase.createdAt.localeCompare(a.purchase.createdAt)
  );
}
