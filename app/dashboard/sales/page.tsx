"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarDays, Moon, Sun } from "lucide-react";
import { DailySalesLineChart } from "@/components/dashboard/charts";
import { SummaryCard } from "@/components/dashboard/summary-card";
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
import { groupSalesByDate, initialSales, sumBy } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

const allShifts = "all";

export default function SalesPage() {
  const [date, setDate] = useState("");
  const [shift, setShift] = useState(allShifts);
  const filteredSales = useMemo(
    () =>
      initialSales.filter(
        (sale) =>
          (!date || sale.date === date) &&
          (shift === allShifts || sale.shift === shift)
      ),
    [date, shift]
  );
  const dailySales = groupSalesByDate(filteredSales);
  const totalSales = sumBy(filteredSales, (sale) => sale.amount);
  const daySales = sumBy(
    filteredSales.filter((sale) => sale.shift === "Day"),
    (sale) => sale.amount
  );
  const nightSales = sumBy(
    filteredSales.filter((sale) => sale.shift === "Night"),
    (sale) => sale.amount
  );
  const averageDailySales =
    dailySales.length === 0 ? 0 : totalSales / dailySales.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          description={`${filteredSales.length} shift reports`}
          icon={Banknote}
        />
        <SummaryCard
          title="Average Daily Sales"
          value={formatCurrency(averageDailySales)}
          description={`${dailySales.length} operating days`}
          icon={CalendarDays}
        />
        <SummaryCard
          title="Day Shift Sales"
          value={formatCurrency(daySales)}
          description="Morning and daytime shifts"
          icon={Sun}
        />
        <SummaryCard
          title="Night Shift Sales"
          value={formatCurrency(nightSales)}
          description="Evening and overnight shifts"
          icon={Moon}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <DailySalesLineChart data={dailySales} />
        <Card>
          <CardHeader>
            <CardTitle>Sales Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Date
              </div>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Shift
              </div>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allShifts}>All shifts</SelectItem>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales totals extracted from the printed day and night shift reports.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Day Shift</TableHead>
                <TableHead className="text-right">Night Shift</TableHead>
                <TableHead className="text-right">Daily Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...dailySales].reverse().map((sale) => (
                <TableRow key={sale.date}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {sale.day ? formatCurrency(sale.day) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {sale.night ? formatCurrency(sale.night) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(sale.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
