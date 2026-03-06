"use client";

import { useState } from "react";
import {
  Search, DollarSign, CalendarClock, CalendarCheck2,
  Plus, AlertCircle, Clock, CheckCircle2, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordPaymentSheet } from "@/components/payments/RecordPaymentSheet";
import { CreatePaymentRecordSheet } from "@/components/payments/CreatePaymentRecordSheet";
import { useTenantsBilling } from "@/hooks/usePayments";
import { CITIES, MONTHS, type PaymentRecord } from "@/lib/types";
import type { TenantBillingRow } from "@/lib/api/payments";
import { format, parseISO } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

// ─── Status chip ──────────────────────────────────────────────────────────────

const StatusChip = ({ status, daysUntilDue, hasRecord }: {
  status: string;
  daysUntilDue: number;
  hasRecord: boolean;
}) => {
  if (!hasRecord && daysUntilDue > 0) return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
      <CalendarClock className="h-3 w-3" />
      Due {format(new Date(Date.now() + daysUntilDue * 86400000), "MMM d")}
    </Badge>
  );
  if (!hasRecord && daysUntilDue <= 0) return (
    <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 gap-1">
      <AlertCircle className="h-3 w-3" />
      No record yet
    </Badge>
  );
  if (status === "PAID_ON_TIME") return (
    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Paid on time
    </Badge>
  );
  if (status === "PAID_LATE") return (
    <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30 gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Paid late
    </Badge>
  );
  if (status === "PARTIAL") return (
    <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-400/30 gap-1">
      <Clock className="h-3 w-3" />
      Partial
    </Badge>
  );
  if (status === "PENDING" && daysUntilDue < 0) return (
    <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 gap-1">
      <AlertCircle className="h-3 w-3" />
      Overdue {Math.abs(daysUntilDue)}d
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  // For opening an existing payment record
  const [openRecord, setOpenRecord] = useState<PaymentRecord | null>(null);
  // For creating a new record pre-filled from tenant row
  const [createFor, setCreateFor] = useState<TenantBillingRow | null>(null);

  const { data: rows, isLoading } = useTenantsBilling({
    month,
    year,
    search: search || undefined,
    city: cityFilter !== "all" ? cityFilter : undefined,
  });

  const years = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - i);

  const totalRent = rows?.reduce((s, r) => s + r.rentAmount, 0) ?? 0;
  const totalPaid = rows?.reduce((s, r) => s + (r.record ? Number(r.record.amountPaid) : 0), 0) ?? 0;
  const totalLate = rows?.reduce((s, r) => s + r.lateFeeToday, 0) ?? 0;
  const noRecord = rows?.filter((r) => !r.hasRecord).length ?? 0;
  const paid = rows?.filter((r) => r.paymentStatus === "PAID_ON_TIME" || r.paymentStatus === "PAID_LATE").length ?? 0;
  const overdue = rows?.filter((r) => r.hasRecord && r.paymentStatus === "PENDING" && r.daysUntilDue < 0).length ?? 0;

  const isCurrentMonth = month === CURRENT_MONTH && year === CURRENT_YEAR;

  return (
    <div className="space-y-5 p-6 md:p-8">
      <PageHeader
        title="Payments"
        description={`Billing overview — ${MONTHS[month - 1]} ${year}`}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Expected", value: formatCurrency(totalRent), color: "text-foreground" },
          { label: "Collected", value: formatCurrency(totalPaid), color: "text-emerald-500" },
          { label: "Pending", value: formatCurrency(Math.max(0, totalRent - totalPaid)), color: "text-red-400" },
          { label: "Late Fees", value: formatCurrency(totalLate), color: "text-amber-400" },
          {
            label: "Status",
            value: `${paid} paid · ${overdue} overdue · ${noRecord} no record`,
            color: "text-muted-foreground",
            small: true,
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className={cn("mt-1 font-bold", k.small ? "text-xs leading-5 mt-1.5" : "text-lg", k.color)}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="h-9 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenant or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Tenant billing cards */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : !rows?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <DollarSign className="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium">No active tenants found</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a tenant to see billing here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const isPaid = row.paymentStatus === "PAID_ON_TIME" || row.paymentStatus === "PAID_LATE";
            const amountPaid = row.record ? Number(row.record.amountPaid) : 0;

            return (
              <div
                key={row.tenantId}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-colors",
                  isPaid ? "border-emerald-500/20 bg-emerald-500/5" :
                  !row.hasRecord ? "border-border" :
                  row.daysUntilDue < 0 ? "border-red-500/20 bg-red-500/5" :
                  "border-border"
                )}
              >
                {/* Left: tenant info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {row.displayName}
                    </span>
                    <StatusChip
                      status={row.paymentStatus}
                      daysUntilDue={row.daysUntilDue}
                      hasRecord={row.hasRecord}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.property.address} · {row.property.city}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                    <span>Rent: <span className="font-medium text-foreground">{formatCurrency(row.rentAmount)}</span></span>
                    {amountPaid > 0 && (
                      <span>Paid: <span className="font-medium text-emerald-500">{formatCurrency(amountPaid)}</span></span>
                    )}
                    {row.lateFeeToday > 0 && (
                      <span>Late fee: <span className="font-medium text-amber-400">{formatCurrency(row.lateFeeToday)}</span></span>
                    )}
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <CalendarCheck2 className="h-3 w-3 shrink-0" />
                      Next due: <span className="font-medium text-foreground">{format(parseISO(row.nextDueDate), "MMM d, yyyy")}</span>
                    </span>
                  </div>
                </div>

                {/* Right: balance + action */}
                <div className="flex items-center gap-3 shrink-0">
                  {!isPaid && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
                      <p className={cn(
                        "text-base font-bold",
                        row.totalDueToday > 0 ? "text-red-400" : "text-emerald-500"
                      )}>
                        {formatCurrency(row.totalDueToday)}
                      </p>
                    </div>
                  )}

                  {isPaid ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => row.record && setOpenRecord(row.record)}
                    >
                      View
                    </Button>
                  ) : row.hasRecord ? (
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => row.record && setOpenRecord(row.record)}
                    >
                      <DollarSign className="mr-1 h-3.5 w-3.5" />
                      Record Payment
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => setCreateFor(row)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Open {isCurrentMonth ? "This Month" : `${MONTHS[month - 1]}`}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {row.hasRecord && (
                        <DropdownMenuItem onClick={() => row.record && setOpenRecord(row.record)}>
                          <DollarSign className="mr-2 h-3.5 w-3.5" />
                          {isPaid ? "View Record" : "Add Payment"}
                        </DropdownMenuItem>
                      )}
                      {!row.hasRecord && (
                        <DropdownMenuItem onClick={() => setCreateFor(row)}>
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          Create {MONTHS[month - 1]} Record
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record payment sheet (existing record) */}
      {openRecord && (
        <RecordPaymentSheet
          open={!!openRecord}
          onClose={() => setOpenRecord(null)}
          record={openRecord}
        />
      )}

      {/* Create payment record sheet (new record for tenant) */}
      {createFor && (
        <CreatePaymentRecordSheet
          open={!!createFor}
          onClose={() => setCreateFor(null)}
          tenantRow={createFor}
          month={month}
          year={year}
        />
      )}
    </div>
  );
}
