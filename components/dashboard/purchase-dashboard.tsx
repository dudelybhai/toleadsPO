"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PurchaseFormDialog } from "@/components/dashboard/purchase-form-dialog";
import {
  filterPurchases,
  getDashboardMetrics,
  getPurchaseBillChanges,
  getSupplierTotals,
  groupPaymentMethod,
  groupPurchaseByCategory,
  groupPurchaseByDate,
  groupShiftExpenses
} from "@/lib/data";
import {
  categories,
  paymentMethods,
  shiftTypes,
  type PurchaseEntry,
  type PurchaseFilters,
  type SalaryEntry,
  type SalesEntry
} from "@/lib/types";
import { apiDate, apiRequest, type ListResponse } from "@/lib/client-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SummaryCard } from "@/components/dashboard/summary-card";
import {
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  Wallet
} from "lucide-react";
import {
  CategoryPieChart,
  DailyExpenseLineChart,
  PaymentBarChart,
  ShiftExpenseChart
} from "@/components/dashboard/charts";

const all = "all";

export function PurchaseDashboard({ compact = false }: { compact?: boolean }) {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [salaries, setSalaries] = useState<SalaryEntry[]>([]);
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [filters, setFilters] = useState<PurchaseFilters>({
    date: "",
    category: "",
    paymentMethod: "",
    shift: "",
    search: ""
  });

  useEffect(() => {
    Promise.all([
      apiRequest<ListResponse<PurchaseEntry & { supplierName: string }>>(
        "/api/purchases?pageSize=200"
      ),
      apiRequest<ListResponse<SalaryEntry>>("/api/salaries?pageSize=200"),
      apiRequest<ListResponse<SalesEntry>>("/api/sales?pageSize=200")
    ])
      .then(([purchaseData, salaryData, salesData]) => {
        setPurchases(
          purchaseData.items.map((item) => ({
            ...item,
            date: apiDate(item.date),
            supplier: item.supplierName,
            quantity: Number(item.quantity),
            amount: Number(item.amount)
          }))
        );
        setSalaries(
          salaryData.items.map((item) => ({
            ...item,
            date: apiDate(item.date),
            amount: Number(item.amount)
          }))
        );
        setSales(
          salesData.items.map((item) => ({
            ...item,
            date: apiDate(item.date),
            amount: Number(item.amount)
          }))
        );
      })
      .catch((error) => console.error("Unable to load dashboard data", error));
  }, []);

  const filteredPurchases = useMemo(
    () => filterPurchases(purchases, filters),
    [purchases, filters]
  );
  const relatedSalaries = salaries.filter(
    (salary) =>
      (!filters.date || salary.date === filters.date) &&
      (!filters.shift || salary.shift === filters.shift)
  );
  const relatedSales = sales.filter(
    (sale) =>
      (!filters.date || sale.date === filters.date) &&
      (!filters.shift || sale.shift === filters.shift)
  );
  const operatingPurchases = purchases.filter(
    (purchase) =>
      (!filters.date || purchase.date === filters.date) &&
      (!filters.shift || purchase.shift === filters.shift)
  );
  const metrics = getDashboardMetrics(
    filteredPurchases,
    relatedSalaries,
    relatedSales
  );
  const profitLoss = getDashboardMetrics(
    operatingPurchases,
    relatedSalaries,
    relatedSales
  ).netOperatingAmount;
  const supplierTotals = getSupplierTotals(filteredPurchases);
  const filteredPurchaseIds = new Set(
    filteredPurchases.map((purchase) => purchase.id)
  );
  const billChanges = getPurchaseBillChanges(purchases).filter(({ purchase }) =>
    filteredPurchaseIds.has(purchase.id)
  );

  function updateFilter<K extends keyof PurchaseFilters>(
    key: K,
    value: PurchaseFilters[K]
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function savePurchase(entry: PurchaseEntry) {
    const exists = purchases.some((purchase) => purchase.id === entry.id);
    const saved = await apiRequest<PurchaseEntry & { supplierName: string }>(
      exists ? `/api/purchases/${entry.id}` : "/api/purchases",
      {
        method: exists ? "PATCH" : "POST",
        body: JSON.stringify({
          date: entry.date,
          category: entry.category,
          itemName: entry.itemName,
          supplier: entry.supplier,
          quantity: entry.quantity,
          unit: entry.unit,
          amount: entry.amount,
          paymentMethod: entry.paymentMethod,
          shift: entry.shift,
          remarks: entry.remarks,
          source: "MANUAL"
        })
      }
    );
    const normalized: PurchaseEntry = {
      ...saved,
      date: apiDate(saved.date),
      supplier: saved.supplierName,
      quantity: Number(saved.quantity),
      amount: Number(saved.amount)
    };
    setPurchases((current) => {
      if (exists) {
        return current.map((purchase) =>
          purchase.id === normalized.id ? normalized : purchase
        );
      }
      return [normalized, ...current];
    });
  }

  async function deletePurchase(id: string) {
    await apiRequest<void>(`/api/purchases/${id}`, { method: "DELETE" });
    setPurchases((current) => current.filter((purchase) => purchase.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Sales"
          value={formatCurrency(metrics.salesTotal)}
          description={`${relatedSales.length} shift reports`}
          icon={CircleDollarSign}
        />
        <SummaryCard
          title="Total Purchases"
          value={formatCurrency(metrics.purchaseTotal)}
          description={`${filteredPurchases.length} purchase entries`}
          icon={ReceiptText}
        />
        <SummaryCard
          title="Salary Total"
          value={formatCurrency(metrics.salaryTotal)}
          description="Staff payments in range"
          icon={Wallet}
          tone="warning"
        />
        <SummaryCard
          title="Daily P/L"
          value={formatCurrency(profitLoss)}
          description="Sales minus purchases and salaries"
          icon={TrendingUp}
          tone={profitLoss >= 0 ? "default" : "warning"}
        />
      </div>

      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Bill Differences</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Compares each repeated item&apos;s bill total with its previous bill.
              This is not a unit-price comparison because source quantities are
              unavailable.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Previous Date</TableHead>
                  <TableHead>Current Date</TableHead>
                  <TableHead className="text-right">Previous Bill</TableHead>
                  <TableHead className="text-right">Current Bill</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billChanges.map(
                  ({
                    purchase,
                    previousPurchase,
                    difference,
                    percentageChange
                  }) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.itemName}
                      </TableCell>
                      <TableCell>{formatDate(previousPurchase.date)}</TableCell>
                      <TableCell>{formatDate(purchase.date)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(previousPurchase.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(purchase.amount)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-medium ${
                          difference > 0
                            ? "text-red-600"
                            : difference < 0
                              ? "text-emerald-600"
                              : ""
                        }`}
                      >
                        {difference > 0 ? "+" : ""}
                        {formatCurrency(difference)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {difference > 0 ? "+" : ""}
                        {percentageChange.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!compact && (
        <div className="grid gap-4 xl:grid-cols-2">
          <CategoryPieChart data={groupPurchaseByCategory(filteredPurchases)} />
          <DailyExpenseLineChart data={groupPurchaseByDate(filteredPurchases)} />
          <PaymentBarChart data={groupPaymentMethod(filteredPurchases)} />
          <ShiftExpenseChart
            data={groupShiftExpenses(filteredPurchases, salaries)}
          />
        </div>
      )}

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Purchase Entry</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit, delete, search, and filter stored purchase records.
            </p>
          </div>
          <PurchaseFormDialog onSave={savePurchase} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search supplier or item"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </div>
            <Input
              type="date"
              value={filters.date}
              onChange={(event) => updateFilter("date", event.target.value)}
            />
            <Select
              value={filters.category || all}
              onValueChange={(value) =>
                updateFilter("category", value === all ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.paymentMethod || all}
              onValueChange={(value) =>
                updateFilter("paymentMethod", value === all ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All payments</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.shift || all}
              onValueChange={(value) =>
                updateFilter("shift", value === all ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All shifts</SelectItem>
                {shiftTypes.map((shift) => (
                  <SelectItem key={shift} value={shift}>
                    {shift}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(purchase.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{purchase.category}</Badge>
                  </TableCell>
                  <TableCell className="min-w-40 font-medium">
                    {purchase.itemName}
                    {purchase.remarks && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {purchase.remarks}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="min-w-40">{purchase.supplier}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {purchase.quantity} {purchase.unit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        purchase.paymentMethod === "Cash" ? "warning" : "default"
                      }
                    >
                      {purchase.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>{purchase.shift}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(purchase.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <PurchaseFormDialog
                        purchase={purchase}
                        onSave={savePurchase}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Edit entry">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete entry"
                        onClick={() => deletePurchase(purchase.id)}
                      >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier / Vendor Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {supplierTotals.slice(0, 6).map((supplier) => (
                <div
                  key={supplier.supplier}
                  className="rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                >
                  <div className="text-sm font-medium">{supplier.supplier}</div>
                  <div className="mt-2 font-mono text-xl font-semibold">
                    {formatCurrency(supplier.amount)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {supplier.count} entries
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
