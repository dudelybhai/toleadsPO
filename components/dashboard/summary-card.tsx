import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "cash" | "paynow" | "warning";
};

const tones = {
  default: "bg-primary text-primary-foreground",
  cash: "bg-secondary text-foreground",
  paynow: "bg-secondary text-foreground",
  warning: "bg-secondary text-foreground"
};

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default"
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("rounded-md p-2", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-2xl font-semibold tracking-normal">
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
