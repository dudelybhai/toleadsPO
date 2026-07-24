"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  categories,
  paymentMethods,
  shiftTypes,
  units,
  type PurchaseEntry
} from "@/lib/types";

type FormState = Omit<PurchaseEntry, "id" | "createdAt">;

const emptyForm: FormState = {
  date: new Date().toISOString().slice(0, 10),
  category: "Meat",
  itemName: "",
  supplier: "",
  quantity: 1,
  unit: "kg",
  amount: 0,
  paymentMethod: "Cash",
  shift: "Day",
  remarks: ""
};

type PurchaseFormDialogProps = {
  purchase?: PurchaseEntry;
  onSave: (purchase: PurchaseEntry) => void;
  trigger?: React.ReactNode;
};

export function PurchaseFormDialog({
  purchase,
  onSave,
  trigger
}: PurchaseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (purchase) {
      const { id, createdAt, ...values } = purchase;
      void id;
      void createdAt;
      setForm(values);
    }
  }, [purchase, open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...form,
      id: purchase?.id ?? `po-${Date.now()}`,
      quantity: Number(form.quantity),
      amount: Number(form.amount),
      createdAt: purchase?.createdAt ?? new Date().toISOString()
    });
    if (!purchase) {
      setForm(emptyForm);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            New purchase
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? "Edit purchase" : "Add purchase entry"}</DialogTitle>
          <DialogDescription>
            Record category, supplier, payment method, and shift details.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => update("category", value as FormState["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemName">Item name</Label>
              <Input
                id="itemName"
                value={form.itemName}
                onChange={(event) => update("itemName", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={form.supplier}
                onChange={(event) => update("supplier", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(event) => update("quantity", Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(value) => update("unit", value as FormState["unit"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => update("amount", Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(value) =>
                  update("paymentMethod", value as FormState["paymentMethod"])
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
                onValueChange={(value) => update("shift", value as FormState["shift"])}
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
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={form.remarks}
                onChange={(event) => update("remarks", event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{purchase ? "Save changes" : "Add entry"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
