"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/FormField";
import { useCreateTenant, useUpdateTenant } from "@/hooks/useTenants";
import { useProperties } from "@/hooks/useProperties";
import { PAYMENT_METHODS, type Tenant, type PaymentMethod, type ContractType } from "@/lib/types";
import type { CreateTenantPayload } from "@/lib/api/tenants";
import { Users, DollarSign, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Section ──────────────────────────────────────────────────────────────────

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>
      )}
    </div>
    {children}
  </div>
);

// ─── Form state ───────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateTenantPayload = {
  displayName: "",
  email: "",
  phone: "",
  propertyId: "",
  moveInDate: "",
  rentAmount: 0,
  preferredPayment: undefined,
  notes: "",
  contract: {
    type: "REGULAR",
    startDate: "",
    durationYears: 1,
  },
};

interface TenantSheetProps {
  open: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TenantSheet = ({ open, onClose, tenant }: TenantSheetProps) => {
  const [form, setForm] = useState<CreateTenantPayload>(EMPTY_FORM);
  const [rtoEnabled, setRtoEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: propertiesData } = useProperties({ limit: 100 });
  const create = useCreateTenant();
  const update = useUpdateTenant();
  const isEditing = !!tenant;
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (tenant) {
      setForm({
        displayName: tenant.displayName,
        email: tenant.email,
        phone: tenant.phone ?? "",
        propertyId: tenant.propertyId,
        moveInDate: tenant.moveInDate?.split("T")[0] ?? "",
        rentAmount: Number(tenant.rentAmount),
        preferredPayment: tenant.preferredPayment ?? undefined,
        notes: tenant.notes ?? "",
        contract: { type: "REGULAR", startDate: "", durationYears: 1 },
      });
    } else {
      setForm(EMPTY_FORM);
      setRtoEnabled(false);
    }
    setErrors({});
  }, [tenant, open]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.displayName.trim()) e.displayName = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.propertyId) e.propertyId = "Property is required";
    if (!form.moveInDate) e.moveInDate = "Move-in date is required";
    if (!form.rentAmount || form.rentAmount <= 0) e.rentAmount = "Rent must be greater than 0";
    if (!isEditing && !form.contract.startDate) e.contractStart = "Contract start date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isEditing && tenant) {
      await update.mutateAsync({
        id: tenant.id,
        body: {
          displayName: form.displayName,
          phone: form.phone,
          rentAmount: String(form.rentAmount),
          preferredPayment: form.preferredPayment,
          notes: form.notes,
        },
      });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  const vacantProperties = propertiesData?.data.filter(
    (p) => p.status === "EMPTY" || (isEditing && p.id === form.propertyId)
  ) ?? [];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {/* Header */}
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              isEditing ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground"
            )}>
              <Users className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isEditing ? "Edit Tenant" : "New Tenant"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {isEditing
                  ? "Update tenant information"
                  : "Register a new tenant and create their first lease"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Contact */}
          <Section title="Contact Information">
            <FormField label="Full Name / Holders" required error={errors.displayName}>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Nicole Rosito AND Magdalena S."
                disabled={isPending}
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email" required error={errors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="tenant@email.com"
                  disabled={isPending || isEditing}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(239) 555-0001"
                  disabled={isPending}
                />
              </FormField>
            </div>
          </Section>

          <Separator />

          {/* Lease */}
          <Section title="Lease Details">
            <FormField label="Property" required error={errors.propertyId}>
              <Select
                value={form.propertyId}
                onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v }))}
                disabled={isPending || isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vacant property" />
                </SelectTrigger>
                <SelectContent>
                  {vacantProperties.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No vacant properties
                    </div>
                  ) : (
                    vacantProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.address} · {p.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Move-in Date" required error={errors.moveInDate}>
                <Input
                  type="date"
                  value={form.moveInDate}
                  onChange={(e) => setForm((f) => ({ ...f, moveInDate: e.target.value }))}
                  disabled={isPending}
                />
              </FormField>

              <FormField label="Monthly Rent (USD)" required error={errors.rentAmount}>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rentAmount || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rentAmount: parseFloat(e.target.value) }))
                    }
                    placeholder="1,200.00"
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
              </FormField>
            </div>

            <FormField label="Preferred Payment Method">
              <Select
                value={form.preferredPayment ?? "none"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    preferredPayment: v === "none" ? undefined : (v as PaymentMethod),
                  }))
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </Section>

          {/* Contract (new only) */}
          {!isEditing && (
            <>
              <Separator />
              <Section
                title="Initial Contract"
                description="Creates the first lease agreement for this tenant"
              >
                <FormField label="Contract Type" required>
                  <Select
                    value={form.contract.type}
                    onValueChange={(v) => {
                      setForm((f) => ({
                        ...f,
                        contract: { ...f.contract, type: v as ContractType },
                      }));
                      setRtoEnabled(v === "RTO");
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULAR">Regular Lease</SelectItem>
                      <SelectItem value="RTO">Rent-to-Own (RTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Start Date" required error={errors.contractStart}>
                    <Input
                      type="date"
                      value={form.contract.startDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          contract: { ...f.contract, startDate: e.target.value },
                        }))
                      }
                      disabled={isPending}
                    />
                  </FormField>
                  <FormField label="Duration (years)" required>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={form.contract.durationYears}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          contract: {
                            ...f.contract,
                            durationYears: parseInt(e.target.value) || 1,
                          },
                        }))
                      }
                      disabled={isPending}
                    />
                  </FormField>
                </div>

                {rtoEnabled && (
                  <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-violet-400" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
                        RTO Details
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "purchasePrice", label: "Purchase Price", placeholder: "150,000" },
                        { key: "egsFee", label: "EGS Fee", placeholder: "0" },
                        { key: "optionAgreementMonthly", label: "Option Monthly", placeholder: "300" },
                        { key: "initialDeposit", label: "Initial Deposit", placeholder: "0" },
                      ].map(({ key, label, placeholder }) => (
                        <FormField key={key} label={label}>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              placeholder={placeholder}
                              className="pl-8"
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  contract: {
                                    ...f.contract,
                                    rtoDetails: {
                                      purchasePrice: f.contract.rtoDetails?.purchasePrice ?? 0,
                                      ...f.contract.rtoDetails,
                                      [key]: parseFloat(e.target.value) || 0,
                                    },
                                  },
                                }))
                              }
                              disabled={isPending}
                            />
                          </div>
                        </FormField>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}

          {/* Notes */}
          <Separator />
          <Section title="Internal Notes" description="Never visible to the tenant">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any internal notes or context about this tenant…"
              rows={3}
              disabled={isPending}
            />
          </Section>
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
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending
              ? "Saving…"
              : isEditing
              ? "Save Changes"
              : "Create Tenant"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
