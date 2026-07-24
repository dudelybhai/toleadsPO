"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getSupplierSummaries } from "@/lib/data";
import { apiDate, apiRequest, type ListResponse } from "@/lib/client-api";
import type { PurchaseEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  useEffect(() => {
    apiRequest<ListResponse<PurchaseEntry & { supplierName: string }>>(
      "/api/purchases?pageSize=200"
    )
      .then((data) =>
        setPurchases(
          data.items.map((item) => ({
            ...item,
            date: apiDate(item.date),
            supplier: item.supplierName,
            quantity: Number(item.quantity),
            amount: Number(item.amount)
          }))
        )
      )
      .catch((error) => console.error("Unable to load suppliers", error));
  }, []);
  const suppliers = useMemo(() => getSupplierSummaries(purchases), [purchases]);
  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return suppliers;
    }

    return suppliers.filter(
      (supplier) =>
        supplier.supplier.toLowerCase().includes(query) ||
        supplier.categories.some((category) =>
          category.toLowerCase().includes(query)
        )
    );
  }, [search, suppliers]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="rounded-lg bg-secondary p-3">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Suppliers</div>
              <div className="font-mono text-2xl font-semibold">
                {suppliers.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">Total bills</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {suppliers.reduce((total, supplier) => total + supplier.count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">Supplier spend</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {formatCurrency(
                suppliers.reduce(
                  (total, supplier) => total + supplier.amount,
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Supplier Directory</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Supplier activity calculated from the available purchase records.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search supplier or category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>First Bill</TableHead>
                <TableHead>Latest Bill</TableHead>
                <TableHead className="text-right">Bills</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Latest Amount</TableHead>
                <TableHead className="text-right">Latest Difference</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.supplier}>
                  <TableCell className="font-medium">
                    {supplier.supplier}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(supplier.firstPurchaseDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(supplier.lastPurchaseDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {supplier.count}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(supplier.averageBill)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(supplier.latestAmount)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium ${
                      supplier.latestDifference !== null &&
                      supplier.latestDifference > 0
                        ? "text-red-600"
                        : supplier.latestDifference !== null &&
                            supplier.latestDifference < 0
                          ? "text-emerald-600"
                          : ""
                    }`}
                  >
                    {supplier.latestDifference === null
                      ? "-"
                      : `${supplier.latestDifference > 0 ? "+" : ""}${formatCurrency(
                          supplier.latestDifference
                        )}`}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(supplier.amount)}
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
