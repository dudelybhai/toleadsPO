import {
  CategoryPieChart,
  DailyExpenseLineChart,
  PaymentBarChart,
  ShiftExpenseChart
} from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  getDashboardMetrics,
  groupPaymentMethod,
  groupPurchaseByCategory,
  groupPurchaseByDate,
  groupShiftExpenses,
  initialPurchases,
  initialSalaries,
  initialSales
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

function getMonthlySummary() {
  const months = new Map<string, number>();
  initialPurchases.forEach((purchase) => {
    const month = purchase.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + purchase.amount);
  });
  return Array.from(months.entries()).map(([month, amount]) => ({ month, amount }));
}

export default function ReportsPage() {
  const metrics = getDashboardMetrics(
    initialPurchases,
    initialSalaries,
    initialSales
  );
  const daily = groupPurchaseByDate(initialPurchases);
  const monthly = getMonthlySummary();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        <CategoryPieChart data={groupPurchaseByCategory(initialPurchases)} />
        <DailyExpenseLineChart data={daily} />
        <PaymentBarChart data={groupPaymentMethod(initialPurchases)} />
        <ShiftExpenseChart
          data={groupShiftExpenses(initialPurchases, initialSalaries)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Expense Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead className="text-right">Expense</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {
                          initialPurchases.filter(
                            (purchase) => purchase.date === row.date
                          ).length
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead className="text-right">Total Expense</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthly.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{formatCurrency(metrics.salaryTotal)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(row.amount + metrics.salaryTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit/Loss Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-sm text-muted-foreground">Sales total</div>
              <div className="mt-2 font-mono text-2xl font-semibold">
                {formatCurrency(metrics.salesTotal)}
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-sm text-muted-foreground">Total expenses</div>
              <div className="mt-2 font-mono text-2xl font-semibold">
                {formatCurrency(
                  metrics.purchaseTotal + metrics.salaryTotal
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-sm text-muted-foreground">Net P/L</div>
              <div className="mt-2 font-mono text-2xl font-semibold">
                {formatCurrency(metrics.netOperatingAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
