import { Database, Server, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Badge>Local JSON active</Badge>
          <p>
            Mock data lives in <span className="font-medium text-foreground">data/</span>
            and is typed through <span className="font-medium text-foreground">lib/types.ts</span>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            API Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Badge variant="secondary">MongoDB planned</Badge>
          <p>
            Keep the same PurchaseEntry and SalaryEntry contracts when replacing
            local state with App Router route handlers.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Deployment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Badge variant="warning">Vercel ready</Badge>
          <p>
            The app uses standard Next.js 14 scripts and can be deployed with
            Vercel defaults after installing dependencies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
