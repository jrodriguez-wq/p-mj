"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/FormField";
import { useCreatePaymentRecord } from "@/hooks/usePayments";
import { MONTHS } from "@/lib/types";
import type { TenantBillingRow } from "@/lib/api/payments";
import { Building2, DollarSign, Loader2, CalendarDays, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  tenantRow: TenantBillingRow;
  month: number;
  year: number;
}

export const CreatePaymentRecordSheet = ({ open, onClose, tenantRow, month, year }: Props) => {
  const [rentAmount, setRentAmount] = useState(String(tenantRow.rentAmount));
  const [securityDeposit, setSecurityDeposit] = useState("0");
  const [lastMonthDeposit, setLastMonthDeposit] = useState("0");
  const [notes, setNotes] = useState("");

  const create = useCreatePaymentRecord();

  const handleSubmit = async () => {
    await create.mutateAsync({
      tenantId: tenantRow.tenantId,
      propertyId: tenantRow.property.id,
      contractId: tenantRow.contract?.id,
      billingMonth: month,
      billingYear: year,
      rentAmount: parseFloat(rentAmount) || tenantRow.rentAmount,
      securityDeposit: parseFloat(securityDeposit) || 0,
      lastMonthDeposit: parseFloat(lastMonthDeposit) || 0,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base">
                Open {MONTHS[month - 1]} {year} Record
              </SheetTitle>
              <SheetDescription className="text-xs">
                Creates the billing record so payments can be registered
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Tenant + property summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium text-foreground">{tenantRow.displayName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {tenantRow.property.address} · {tenantRow.property.city}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Billing period: {MONTHS[month - 1]} {year}
              {tenantRow.contract && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {tenantRow.contract.type}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Amounts */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amounts
            </h3>

            <FormField label="Rent Amount" required>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="pl-8"
                  disabled={create.isPending}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Default from tenant&apos;s contract: {formatCurrency(tenantRow.rentAmount)}
              </p>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Security Deposit">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="pl-8"
                    disabled={create.isPending}
                  />
                </div>
              </FormField>
              <FormField label="Last Month Deposit">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lastMonthDeposit}
                    onChange={(e) => setLastMonthDeposit(e.target.value)}
                    className="pl-8"
                    disabled={create.isPending}
                  />
                </div>
              </FormField>
            </div>

            <FormField label="Notes">
              <Input
                placeholder="Optional note for this month…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={create.isPending}
              />
            </FormField>
          </div>
        </div>

        <SheetFooter className="border-t border-border px-6 py-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={create.isPending} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending} className="flex-1 sm:flex-none">
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {create.isPending ? "Creating…" : "Create Record"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
