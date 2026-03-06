"use client";

import { useState, useMemo } from "react";
import {
  Phone, DollarSign, RefreshCw, CalendarCheck2, CalendarClock,
  AlertCircle, CheckCircle2, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordPaymentSheet } from "@/components/payments/RecordPaymentSheet";
import { CreatePaymentRecordSheet } from "@/components/payments/CreatePaymentRecordSheet";
import { useTenantsBilling } from "@/hooks/usePayments";
import { formatCurrency } from "@/lib/utils";
import type { PaymentRecord } from "@/lib/types";
import type { TenantBillingRow } from "@/lib/api/payments";
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "today" | "tomorrow" | "overdue";

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

export default function CollectPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openRecord, setOpenRecord] = useState<PaymentRecord | null>(null);
  const [createFor, setCreateFor] = useState<TenantBillingRow | null>(null);

  const { data: rows, isLoading, refetch, isFetching } = useTenantsBilling({
    month: CURRENT_MONTH,
    year: CURRENT_YEAR,
  });

  // Only show tenants that still owe something (not fully paid)
  const pending = useMemo(() => {
    if (!rows) return [];
    return rows.filter(
      (r) => r.paymentStatus !== "PAID_ON_TIME" && r.paymentStatus !== "PAID_LATE"
    );
  }, [rows]);

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const tomorrowStr = format(addDays(now, 1), "yyyy-MM-dd");

  const filtered = useMemo(() => {
    if (filter === "today") return pending.filter((r) => r.dueDate === todayStr || r.nextDueDate === todayStr);
    if (filter === "tomorrow") return pending.filter((r) => r.dueDate === tomorrowStr || r.nextDueDate === tomorrowStr);
    if (filter === "overdue") return pending.filter((r) => r.daysUntilDue < 0);
    return pending;
  }, [pending, filter, todayStr, tomorrowStr]);

  const totalDue = filtered.reduce((s, r) => s + r.totalDueToday, 0);
  const todayLabel = format(new Date(), "EEEE, MMM d");

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All pending", count: pending.length },
    { key: "today", label: "Due today", count: pending.filter((r) => r.dueDate === todayStr || r.nextDueDate === todayStr).length },
    { key: "tomorrow", label: "Due tomorrow", count: pending.filter((r) => r.dueDate === tomorrowStr || r.nextDueDate === tomorrowStr).length },
    { key: "overdue", label: "Overdue", count: pending.filter((r) => r.daysUntilDue < 0).length },
  ];

  return (
    <div className="space-y-5 p-6 md:p-8">
      <PageHeader
        title="Collect"
        description={`${todayLabel} — collect rent from tenants`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className="ml-1 opacity-80">({f.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Total due for filtered list */}
      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total to collect {filter !== "all" ? `(${filtered.length})` : ""}
          </p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalDue)}</p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500/50" />
          <p className="text-sm font-medium text-foreground">
            {pending.length === 0 ? "All caught up!" : `No payments ${filter === "all" ? "pending" : filter === "overdue" ? "overdue" : `due ${filter}`}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pending.length === 0 ? "No pending payments for this month." : "Try another filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const dueDate = parseISO(row.nextDueDate);
            const isDueToday = isToday(dueDate);
            const isDueTomorrow = isTomorrow(dueDate);

            return (
              <div
                key={row.tenantId}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-colors",
                  row.daysUntilDue < 0 && "border-red-500/20 bg-red-500/5",
                  isDueToday && row.daysUntilDue >= 0 && "border-primary/20 bg-primary/5",
                  isDueTomorrow && !isDueToday && "border-border"
                )}
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {row.displayName}
                    </span>
                    {row.daysUntilDue < 0 && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {Math.abs(row.daysUntilDue)}d overdue
                      </Badge>
                    )}
                    {isDueToday && row.daysUntilDue >= 0 && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30 gap-1">
                        <CalendarCheck2 className="h-3 w-3" />
                        Due today
                      </Badge>
                    )}
                    {isDueTomorrow && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Tomorrow
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.property.address} · {row.property.city}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                    <span>Rent: <span className="font-medium text-foreground">{formatCurrency(row.rentAmount)}</span></span>
                    {row.record && Number(row.record.amountPaid) > 0 && (
                      <span>Paid: <span className="text-emerald-500">{formatCurrency(row.record.amountPaid)}</span></span>
                    )}
                    {row.lateFeeToday > 0 && (
                      <span>Late fee: <span className="text-amber-400">{formatCurrency(row.lateFeeToday)}</span></span>
                    )}
                    <span className="whitespace-nowrap">
                      Due: <span className="font-medium text-foreground">{format(dueDate, "MMM d")}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Due</p>
                    <p className="text-base font-bold text-red-400">{formatCurrency(row.totalDueToday)}</p>
                  </div>
                  {row.phone && (
                    <a
                      href={`tel:${row.phone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label={`Call ${row.displayName}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {row.hasRecord ? (
                    <Button size="sm" className="h-8" onClick={() => row.record && setOpenRecord(row.record)}>
                      <DollarSign className="mr-1 h-3.5 w-3.5" />
                      Record
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setCreateFor(row)}>
                      Open month
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openRecord && (
        <RecordPaymentSheet open={!!openRecord} onClose={() => setOpenRecord(null)} record={openRecord} />
      )}
      {createFor && (
        <CreatePaymentRecordSheet
          open={!!createFor}
          onClose={() => setCreateFor(null)}
          tenantRow={createFor}
          month={CURRENT_MONTH}
          year={CURRENT_YEAR}
        />
      )}
    </div>
  );
}
