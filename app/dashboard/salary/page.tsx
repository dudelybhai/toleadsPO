"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Plus, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { sumBy } from "@/lib/data";
import { apiDate, apiRequest, type ListResponse } from "@/lib/client-api";
import {
  paymentMethods,
  shiftTypes,
  staffCostTypes,
  type SalaryEntry
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const emptySalary: Omit<SalaryEntry, "id" | "createdAt"> = {
  date: new Date().toISOString().slice(0, 10),
  staffName: "",
  costType: "OT",
  amount: 0,
  paymentMethod: "Cash",
  shift: "Day",
  remarks: ""
};

export default function SalaryPage() {
  const [salaries, setSalaries] = useState<SalaryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptySalary);

  useEffect(() => {
    apiRequest<ListResponse<SalaryEntry>>("/api/salaries?pageSize=200")
      .then((data) =>
        setSalaries(
          data.items.map((item) => ({
            ...item,
            date: apiDate(item.date),
            amount: Number(item.amount)
          }))
        )
      )
      .catch((error) => console.error("Unable to load salaries", error));
  }, []);

  const totals = useMemo(
    () => ({
      total: sumBy(salaries, (salary) => salary.amount),
      cash: sumBy(
        salaries.filter((salary) => salary.paymentMethod === "Cash"),
        (salary) => salary.amount
      ),
      staff: new Set(
        salaries
          .map((salary) => salary.staffName.trim().toLowerCase())
          .filter(Boolean)
      ).size
    }),
    [salaries]
  );

  async function saveSalary(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await apiRequest<SalaryEntry>("/api/salaries", {
      method: "POST",
      body: JSON.stringify({ ...form, amount: Number(form.amount), source: "MANUAL" })
    });
    setSalaries((current) => [
      { ...saved, date: apiDate(saved.date), amount: Number(saved.amount) },
      ...current
    ]);
    setForm(emptySalary);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Salary / Staff Payments"
          value={formatCurrency(totals.total)}
          description="OT, Malaysian salary, and advances"
          icon={Wallet}
        />
        <SummaryCard
          title="Cash Salary"
          value={formatCurrency(totals.cash)}
          description="Staff payments by cash"
          icon={Banknote}
          tone="cash"
        />
        <SummaryCard
          title="Total Staff"
          value={String(totals.staff)}
          description="Unique staff in salary records"
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Salary / Staff Payments</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track OT, Malaysian salary, and staff advances.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add staff payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add staff payment</DialogTitle>
                <DialogDescription>
                  Record salary cost by type, shift, and payment method.
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={saveSalary}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm({ ...form, date: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Staff name</Label>
                    <Input
                      value={form.staffName}
                      onChange={(event) =>
                        setForm({ ...form, staffName: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost type</Label>
                    <Select
                      value={form.costType}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          costType: value as SalaryEntry["costType"]
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {staffCostTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
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
                        setForm({ ...form, amount: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          paymentMethod: value as SalaryEntry["paymentMethod"]
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift</Label>
                    <Select
                      value={form.shift}
                      onValueChange={(value) =>
                        setForm({ ...form, shift: value as SalaryEntry["shift"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftTypes.map((shift) => (
                          <SelectItem key={shift} value={shift}>
                            {shift}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
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
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add payment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((salary) => (
                <TableRow key={salary.id}>
                  <TableCell>{formatDate(salary.date)}</TableCell>
                  <TableCell className="font-medium">{salary.staffName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{salary.costType}</Badge>
                  </TableCell>
                  <TableCell>{salary.paymentMethod}</TableCell>
                  <TableCell>{salary.shift}</TableCell>
                  <TableCell className="min-w-40 text-muted-foreground">
                    {salary.remarks}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(salary.amount)}
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
