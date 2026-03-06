"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CollectionProgressProps {
  expected?: number;
  collected?: number;
  rate?: number;
  loading?: boolean;
}

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export const CollectionProgress = ({
  expected = 0,
  collected = 0,
  rate = 0,
  loading,
}: CollectionProgressProps) => {
  const pct = Math.min(rate, 100);
  const color =
    pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-500";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Monthly Collection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">{pct}%</span>
              <span className="mb-0.5 text-xs text-muted-foreground">collected</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Collected: <span className="font-medium text-foreground">{fmt(collected)}</span></span>
              <span>Expected: <span className="font-medium text-foreground">{fmt(expected)}</span></span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
