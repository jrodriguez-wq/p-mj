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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/FormField";
import { PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { useAddTransaction, useDeleteTransaction, usePaymentRecord } from "@/hooks/usePayments";
import { PAYMENT_METHODS, type PaymentRecord, type PaymentMethod, type PaymentTransaction } from "@/lib/types";
import { format } from "date-fns";
import { CreditCard, AlertCircle, DollarSign, Loader2, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface RecordPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  record: PaymentRecord;
}

export const RecordPaymentSheet = ({ open, onClose, record }: RecordPaymentSheetProps) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>("HEMLANE");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [txToDelete, setTxToDelete] = useState<PaymentTransaction | null>(null);

  const { data: freshRecord, refetch } = usePaymentRecord(record.id, {
    initialData: record,
    enabled: open,
  });
  const displayRecord = freshRecord ?? record;

  const addTx = useAddTransaction(record.id);
  const deleteTx = useDeleteTransaction(record.id, { onSuccess: () => refetch() });

  // Total due = rent + late fee; remaining = what they still owe (totalDueToday is already that)
  const rent = Number(displayRecord.rentAmount);
  const paid = Number(displayRecord.amountPaid);
  const lateFee = Number(displayRecord.lateFeeToday ?? displayRecord.lateFeesAmount ?? 0);
  const totalDue = rent + lateFee;
  const remaining = Math.max(0, Number(displayRecord.totalDueToday ?? (totalDue - paid)));

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    await addTx.mutateAsync({
      amount: amt,
      transactionDate: date,
      paymentMethod: method,
      receivedBy: receivedBy || undefined,
      notes: notes || undefined,
    });
    setAmount("");
    setNotes("");
    onClose();
  };

  const handleFillRemaining = () => {
    if (remaining > 0) setAmount(remaining.toFixed(2));
  };

  const isPending = addTx.isPending;
  const amtValue = parseFloat(amount);
  const isValid = !isNaN(amtValue) && amtValue > 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base">Record Payment</SheetTitle>
              <SheetDescription className="text-xs">
                Add a payment transaction for this record
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Summary card */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {displayRecord.tenant?.displayName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayRecord.property?.address ?? ""}{" "}
                  {displayRecord.billingMonth
                    ? `· ${format(new Date(displayRecord.billingMonth + "-01"), "MMMM yyyy")}`
                    : ""}
                </p>
              </div>
              <PaymentStatusBadge status={displayRecord.paymentStatus} />
            </div>

            {/* Amounts row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Rent",  value: formatCurrency(displayRecord.rentAmount), muted: true },
                { label: "Paid",  value: formatCurrency(displayRecord.amountPaid), muted: true },
                {
                  label: "Balance",
                  value: formatCurrency(remaining),
                  muted: false,
                  highlight: remaining > 0,
                },
              ].map(({ label, value, muted, highlight }) => (
                <div key={label} className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      muted ? "text-muted-foreground" : highlight ? "text-destructive" : "text-emerald-500"
                    )}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Late fee warning */}
            {displayRecord.lateFeeToday !== undefined && displayRecord.lateFeeToday > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-500">
                  Late fee accrued today: <span className="font-semibold">{formatCurrency(displayRecord.lateFeeToday)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Previous transactions */}
          {(displayRecord.transactions?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Payment History
              </h3>
              <div className="space-y-1.5 rounded-lg border border-border overflow-hidden">
                {displayRecord.transactions?.map((t, i) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2 text-xs",
                      i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                    )}
                  >
                    <span className="text-muted-foreground shrink-0">
                      {format(new Date(t.transactionDate), "MMM d, yyyy")}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {t.paymentMethod.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-foreground shrink-0">{formatCurrency(t.amount)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setTxToDelete(t)}
                      disabled={deleteTx.isPending}
                      aria-label={`Remove payment ${formatCurrency(t.amount)} on ${format(new Date(t.transactionDate), "MMM d, yyyy")}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Transaction form */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              New Transaction
            </h3>

            <FormField label="Amount (USD)" required>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={remaining > 0 ? String(remaining) : "0"}
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
                {remaining > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillRemaining}
                    disabled={isPending}
                    className="shrink-0 text-xs"
                  >
                    Full Balance
                  </Button>
                )}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Payment Date" required>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isPending}
                />
              </FormField>

              <FormField label="Method" required>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as PaymentMethod)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Received By">
              <Input
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Collector's name (optional)"
                disabled={isPending}
              />
            </FormField>

            <FormField label="Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional transaction notes…"
                disabled={isPending}
              />
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="border-t border-border px-6 py-4 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !isValid}
            className="flex-1 sm:flex-none"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Recording…" : "Record Payment"}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Delete transaction confirmation */}
      <Dialog open={!!txToDelete} onOpenChange={(open) => !open && setTxToDelete(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Remove this payment?</DialogTitle>
                <DialogDescription className="mt-0.5">
                  This will remove the transaction from the record. Totals will be recalculated.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {txToDelete && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">
                {format(new Date(txToDelete.transactionDate), "MMM d, yyyy")} · {txToDelete.paymentMethod.replace(/_/g, " ")}
              </span>
              <span className="font-semibold">{formatCurrency(txToDelete.amount)}</span>
            </div>
          )}
          <DialogFooter className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setTxToDelete(null)} disabled={deleteTx.isPending}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!txToDelete) return;
                await deleteTx.mutateAsync(txToDelete.id);
                setTxToDelete(null);
              }}
              disabled={deleteTx.isPending}
            >
              {deleteTx.isPending ? "Removing…" : "Remove payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};
