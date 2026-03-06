"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Home, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertSeverityDot } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { DashboardAlerts, ContractAlert, PaymentAlert, VacantAlert } from "@/lib/types";

interface AlertsPanelProps {
  alerts?: DashboardAlerts;
  loading?: boolean;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const AlertsPanel = ({ alerts, loading }: AlertsPanelProps) => {
  const allAlerts = [
    ...(alerts?.contracts ?? []).map((a) => ({ ...a, _kind: "contract" as const })),
    ...(alerts?.payments ?? []).map((a) => ({ ...a, _kind: "payment" as const })),
    ...(alerts?.vacant ?? []).map((a) => ({ ...a, _kind: "vacant" as const })),
  ].sort((a, b) => {
    const order = { RED: 0, YELLOW: 1, GREEN: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Priority Alerts
          </CardTitle>
          {alerts && (
            <div className="flex items-center gap-2 text-xs">
              {alerts.totals.red > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {alerts.totals.red}
                </span>
              )}
              {alerts.totals.yellow > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {alerts.totals.yellow}
                </span>
              )}
              {alerts.totals.green > 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {alerts.totals.green}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-0 divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <Skeleton className="mt-0.5 h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No active alerts
          </div>
        ) : (
          <ul className="divide-y divide-border max-h-[340px] overflow-y-auto">
            {allAlerts.slice(0, 12).map((alert, idx) => (
              <li
                key={`${alert._kind}-${alert.entityId}-${idx}`}
                className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <AlertSeverityDot severity={alert.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-snug">{alert.message}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {alert._kind !== "vacant" && "tenant" in alert && (
                      <Link
                        href={`/dashboard/tenants/${(alert as ContractAlert | PaymentAlert).tenant.id}`}
                        className="hover:text-foreground truncate max-w-[120px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(alert as ContractAlert | PaymentAlert).tenant.displayName}
                      </Link>
                    )}
                    <span className="truncate max-w-[120px]">{alert.property.address}</span>
                    {alert._kind === "contract" && (
                      <span>{formatDate((alert as ContractAlert).endDate)}</span>
                    )}
                    {alert._kind === "payment" && (
                      <span className="text-red-400 font-medium">
                        ${(alert as PaymentAlert).rentAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {alert._kind === "contract" && (
                  <Link
                    href={`/dashboard/contracts?entityId=${alert.entityId}`}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="View contract"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
