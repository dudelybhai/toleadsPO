import Link from "next/link";
import { headers } from "next/headers";
import {
  CalendarRange,
  Database,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  Server,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "No end date";
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Singapore"
  }).format(value);
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [period, purchaseCount, salaryCount, salesCount] = await Promise.all([
    prisma.accountingPeriod.findFirst({
      where: { isOpen: true },
      orderBy: { startsAt: "desc" }
    }),
    prisma.purchase.count({ where: { deletedAt: null } }),
    prisma.salaryEntry.count({ where: { deletedAt: null } }),
    prisma.saleEntry.count({ where: { deletedAt: null } })
  ]);
  const role = session?.user.role ?? "viewer";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, accounting period, data transfer, and system configuration.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
            <CardDescription>Your signed-in Better Auth account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Name</div>
              <div className="mt-1 font-medium">{session?.user.name ?? "Unknown"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Email</div>
              <div className="mt-1 break-all font-medium">
                {session?.user.email ?? "Unknown"}
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground">Access role</span>
              <Badge className="capitalize">{role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              Accounting Period
            </CardTitle>
            <CardDescription>The period accepting new transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {period?.name ?? "No open accounting period"}
              </span>
              <Badge variant={period?.isOpen ? "default" : "warning"}>
                {period?.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Starts</div>
                <div className="mt-1 font-medium">
                  {period ? formatDate(period.startsAt) : "Not configured"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Ends</div>
                <div className="mt-1 font-medium">
                  {period ? formatDate(period.endsAt) : "Not configured"}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions dated before 1 July 2026 are rejected by the API.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database
            </CardTitle>
            <CardDescription>Live storage and record status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">Neon PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Connection</span>
              <Badge>Connected</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
              <div>
                <div className="font-mono text-lg font-semibold">{purchaseCount}</div>
                <div className="text-xs text-muted-foreground">Purchases</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold">{salaryCount}</div>
                <div className="text-xs text-muted-foreground">Salaries</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold">{salesCount}</div>
                <div className="text-xs text-muted-foreground">Sales</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
            <CardDescription>
              Import the master workbook or download a database backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/data">
                <FileSpreadsheet className="h-4 w-4" />
                Open data import
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export/excel">
                <Download className="h-4 w-4" />
                Export Excel
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Authentication and access protections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <LockKeyhole className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-medium">Public signup disabled</div>
                <div className="text-xs text-muted-foreground">
                  New accounts cannot register from the sign-in page.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Server className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-medium">Server-side authorization</div>
                <div className="text-xs text-muted-foreground">
                  Every API operation checks the user session and role.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
