"use client";

import { useMemo, useState } from "react";
import { HandCoins, Plus, ReceiptText, Search, Users } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { initialPurchases, initialSalaries, sumBy } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

const all = "all";

type ExpenseRow = {
  id: string;
  date: string;
  type: "Purchase" | "Staff" | "Other";
  category: string;
  description: string;
  payee: string;
  paymentMethod: string;
  shift: string;
  amount: number;
  remarks: string;
  createdAt: string;
};

const importedExpenses: ExpenseRow[] = [
  ...initialPurchases.map(
    (purchase): ExpenseRow => ({
      id: purchase.id,
      date: purchase.date,
      type: "Purchase",
      category: purchase.category,
      description: purchase.itemName,
      payee: purchase.supplier,
      paymentMethod: purchase.paymentMethod,
      shift: purchase.shift,
      amount: purchase.amount,
      remarks: purchase.remarks,
      createdAt: purchase.createdAt
    })
  ),
  ...initialSalaries.map(
    (salary): ExpenseRow => ({
      id: salary.id,
      date: salary.date,
      type: "Staff",
      category: salary.costType,
      description: salary.costType,
      payee: salary.staffName,
      paymentMethod: salary.paymentMethod,
      shift: salary.shift,
      amount: salary.amount,
      remarks: salary.remarks,
      createdAt: salary.createdAt
    })
  )
].sort(
  (a, b) =>
    b.date.localeCompare(a.date) ||
    b.createdAt.localeCompare(a.createdAt) ||
    b.id.localeCompare(a.id)
);

const emptyExpense = {
  date: new Date().toISOString().slice(0, 10),
  category: "",
  description: "",
  payee: "",
  paymentMethod: "Cash",
  shift: "Day",
  amount: 0,
  remarks: ""
};

export default function ExpensesPage() {
  const [manualExpenses, setManualExpenses] = useState<ExpenseRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyExpense);
  const [date, setDate] = useState("");
  const [type, setType] = useState(all);
  const [shift, setShift] = useState(all);
  const [search, setSearch] = useState("");
  const expenses = useMemo(
    () =>
      [...manualExpenses, ...importedExpenses].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt) ||
          b.id.localeCompare(a.id)
      ),
    [manualExpenses]
  );
  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter(
      (expense) =>
        (!date || expense.date === date) &&
        (type === all || expense.type === type) &&
        (shift === all || expense.shift === shift) &&
        (!query ||
          expense.description.toLowerCase().includes(query) ||
          expense.payee.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query))
    );
  }, [date, expenses, search, shift, type]);
  const purchaseTotal = sumBy(
    filteredExpenses.filter((expense) => expense.type === "Purchase"),
    (expense) => expense.amount
  );
  const staffTotal = sumBy(
    filteredExpenses.filter((expense) => expense.type === "Staff"),
    (expense) => expense.amount
  );
  const otherTotal = sumBy(
    filteredExpenses.filter((expense) => expense.type === "Other"),
    (expense) => expense.amount
  );

  function saveExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const createdAt = new Date().toISOString();
    setManualExpenses((current) => [
      {
        ...form,
        id: `expense-${Date.now()}`,
        type: "Other",
        amount: Number(form.amount),
        createdAt
      },
      ...current
    ]);
    setForm(emptyExpense);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(purchaseTotal + staffTotal + otherTotal)}
          description={`${filteredExpenses.length} expense records`}
          icon={HandCoins}
        />
        <SummaryCard
          title="Purchase Expenses"
          value={formatCurrency(purchaseTotal)}
          description="Supplier and operating purchases"
          icon={ReceiptText}
        />
        <SummaryCard
          title="Staff Expenses"
          value={formatCurrency(staffTotal)}
          description="Salary, OT, and advances"
          icon={Users}
          tone="warning"
        />
        <SummaryCard
          title="Other Expenses"
          value={formatCurrency(otherTotal)}
          description="Manually added operating expenses"
          icon={HandCoins}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Expense Ledger</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Combined purchase, staff payment, and manual expense records.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add expense</DialogTitle>
                <DialogDescription>
                  Record an operating expense not already included in purchases
                  or staff payments.
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={saveExpense}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm({ ...form, date: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={form.category}
                      onChange={(event) =>
                        setForm({ ...form, category: event.target.value })
                      }
                      placeholder="Utilities, rent, repair..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={form.description}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payee</Label>
                    <Input
                      value={form.payee}
                      onChange={(event) =>
                        setForm({ ...form, payee: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(paymentMethod) =>
                        setForm({ ...form, paymentMethod })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="PayNow">PayNow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift</Label>
                    <Select
                      value={form.shift}
                      onValueChange={(value) =>
                        setForm({ ...form, shift: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                        <SelectItem value="7to7">7to7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          amount: Number(event.target.value)
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Input
                      value={form.remarks}
                      onChange={(event) =>
                        setForm({ ...form, remarks: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search expense or payee"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All expense types</SelectItem>
                <SelectItem value="Purchase">Purchases</SelectItem>
                <SelectItem value="Staff">Staff payments</SelectItem>
                <SelectItem value="Other">Other expenses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All shifts</SelectItem>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
                <SelectItem value="7to7">7to7</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={`${expense.type}-${expense.id}`}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        expense.type === "Purchase" ? "secondary" : "warning"
                      }
                    >
                      {expense.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="min-w-48 font-medium">
                    {expense.description}
                    {expense.remarks && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {expense.remarks}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{expense.payee}</TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                  <TableCell>{expense.shift}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(expense.amount)}
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
