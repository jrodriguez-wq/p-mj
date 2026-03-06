import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  accent?: "default" | "green" | "amber" | "red" | "blue" | "purple";
  loading?: boolean;
}

const ACCENT_STYLES = {
  default: "bg-muted/40 text-muted-foreground",
  green:   "bg-emerald-500/10 text-emerald-400",
  amber:   "bg-amber-500/10 text-amber-400",
  red:     "bg-red-500/10 text-red-400",
  blue:    "bg-blue-500/10 text-blue-400",
  purple:  "bg-purple-500/10 text-purple-400",
};

export const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  accent = "default",
  loading,
}: KpiCardProps) => {
  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {sub && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</p>
            )}
          </div>
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", ACCENT_STYLES[accent])}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
