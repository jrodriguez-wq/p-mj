"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLateFeeConfig, useUpdateLateFeeConfig } from "@/hooks/useConfig";
import {
  Settings,
  DollarSign,
  Clock,
  AlertTriangle,
  CalendarDays,
  Save,
  Loader2,
  Info,
  TrendingUp,
} from "lucide-react";

// ─── Info card helper ─────────────────────────────────────────────────────────

const InfoCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

// ─── Late fee preview table ────────────────────────────────────────────────────

const LateFeePreview = ({
  gracePeriodDays,
  flatFeeDay4,
  dailyFeeAfter,
  baseRent,
}: {
  gracePeriodDays: number;
  flatFeeDay4: number;
  dailyFeeAfter: number;
  baseRent: number;
}) => {
  const grace = isNaN(gracePeriodDays) ? 0 : Math.max(0, gracePeriodDays);
  const flat  = isNaN(flatFeeDay4)     ? 0 : flatFeeDay4;
  const daily = isNaN(dailyFeeAfter)   ? 0 : dailyFeeAfter;

  // Build a deduplicated sorted list of representative days
  const rawDays = [1, grace, grace + 1, grace + 4, grace + 8, grace + 15];
  const days = [...new Set(rawDays.filter((d) => d >= 1))].sort((a, b) => a - b);

  const feeForDay = (day: number) => {
    if (day <= grace) return 0;
    const daysLate = day - grace;
    if (daysLate <= 1) return flat;
    return flat + (daysLate - 1) * daily;
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/30 px-4 py-2 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fee Preview · Base rent ${baseRent}/mo
        </p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/10">
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Day paid</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Late fee</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total due</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day, idx) => {
            const fee = feeForDay(day);
            const onTime = fee === 0;
            return (
              <tr key={`${day}-${idx}`} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">Day {day}</td>
                <td className="px-4 py-2">
                  {onTime ? (
                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">On time</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Late</Badge>
                  )}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {onTime ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="text-destructive">+${fee.toFixed(2)}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-foreground">
                  ${(baseRent + fee).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: config, isLoading } = useLateFeeConfig();
  const update = useUpdateLateFeeConfig();

  // Local overrides: undefined means "use server value"
  const [overrides, setOverrides] = useState<Partial<{
    gracePeriodDays: number;
    flatFeeDay4: number;
    dailyFeeAfter: number;
  }>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Merge server config with local overrides — always a defined number
  const form = {
    gracePeriodDays: overrides.gracePeriodDays ?? config?.gracePeriodDays ?? 3,
    flatFeeDay4:     overrides.flatFeeDay4     ?? config?.flatFeeDay4     ?? 42,
    dailyFeeAfter:   overrides.dailyFeeAfter   ?? config?.dailyFeeAfter   ?? 11.35,
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    const parsed = value === "" ? 0 : parseFloat(value);
    setOverrides((o) => ({ ...o, [key]: isNaN(parsed) ? 0 : parsed }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await update.mutateAsync(form);
    setOverrides({});
    setIsDirty(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Configure system behavior, fees, and billing rules"
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                Unsaved changes
              </Badge>
            )}
          </div>
        }
      />

      {/* ── Section: Late Fee Rules ───────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Late Fee Rules</h2>
            <p className="text-xs text-muted-foreground">
              Applied automatically when rent is received after the grace period
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCard
            icon={CalendarDays}
            title="Grace Period"
            description="Days after the 1st of the month where no fee is charged"
          />
          <InfoCard
            icon={AlertTriangle}
            title="Flat Fee"
            description="One-time fee charged the first day after grace period ends"
          />
          <InfoCard
            icon={TrendingUp}
            title="Daily Fee"
            description="Per-day fee added for every additional day past the flat fee"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Grace period */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Grace period (days)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="15"
                  step="1"
                  value={form.gracePeriodDays}
                  onChange={(e) => handleChange("gracePeriodDays", e.target.value)}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rent paid by day {form.gracePeriodDays} = no fee
              </p>
            </div>

            {/* Flat fee */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Flat fee (day {form.gracePeriodDays + 1})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.flatFeeDay4}
                  onChange={(e) => handleChange("flatFeeDay4", e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Charged once on day {form.gracePeriodDays + 1}
              </p>
            </div>

            {/* Daily fee */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Daily fee (after day {form.gracePeriodDays + 1})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.dailyFeeAfter}
                  onChange={(e) => handleChange("dailyFeeAfter", e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Added each day from day {form.gracePeriodDays + 2} on
              </p>
            </div>
          </div>

          <Separator />

          {/* Save button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Changes apply to all new and pending payment records
            </div>
            <Button
              onClick={handleSave}
              disabled={update.isPending || !isDirty}
              size="sm"
              className="gap-2"
            >
              {update.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      {/* ── Live preview ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Fee Preview</h2>
          <p className="text-xs text-muted-foreground">
            How fees accumulate for a $1,000/mo rent with your current settings
          </p>
        </div>
        <LateFeePreview
          gracePeriodDays={form.gracePeriodDays}
          flatFeeDay4={form.flatFeeDay4}
          dailyFeeAfter={form.dailyFeeAfter}
          baseRent={1000}
        />
      </section>

      {/* ── Section: System Flow Guide ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">How the System Works</h2>
          <p className="text-xs text-muted-foreground">
            The correct order to set up a new tenant from start to finish
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Create a Property",
              description: 'Go to Properties → "New Property". Set the address, city, model, and base rent. The status starts as EMPTY.',
              color: "bg-blue-500",
            },
            {
              step: "2",
              title: "Create a Tenant",
              description:
                "Go to Tenants → \"New Tenant\". Select the property, set rent amount, move-in date, and contract type. A contract is automatically created.",
              color: "bg-emerald-500",
            },
            {
              step: "3",
              title: "Open a Payment Record",
              description:
                'Go to Payments → "Collect Today" or "Monthly Table". The tenant appears automatically. Click "Record" to open a new billing month.',
              color: "bg-violet-500",
            },
            {
              step: "4",
              title: "Register Payments",
              description:
                "Inside a payment record, click \"Add Payment\". Enter the amount, date, and method. Late fees are calculated automatically based on the date.",
              color: "bg-amber-500",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${item.color}`}>
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
