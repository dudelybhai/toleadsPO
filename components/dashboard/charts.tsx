"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, shortDate } from "@/lib/utils";

const colors = [
  "#111111",
  "#3f3f46",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#52525b",
  "#27272a",
  "#18181b"
];

type ChartDatum = { name: string; value: number };
type DateDatum = { date: string; amount: number };
type PaymentDatum = { method: string; amount: number };
type ShiftDatum = { shift: string; purchase: number; salary: number };
type SalesDateDatum = {
  date: string;
  day: number;
  night: number;
  amount: number;
};

export function CategoryPieChart({ data }: { data: ChartDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category-wise Expenses</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={98}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DailyExpenseLineChart({ data }: { data: DateDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Expense Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#111111"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DailySalesLineChart({ data }: { data: SalesDateDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="amount"
              name="Sales"
              stroke="#111111"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PaymentBarChart({ data }: { data: PaymentDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method Split</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="method" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#111111" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ShiftExpenseChart({ data }: { data: ShiftDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift-wise Expense Tracking</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="shift" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="purchase" fill="#111111" radius={[6, 6, 0, 0]} />
            <Bar dataKey="salary" fill="#71717a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
