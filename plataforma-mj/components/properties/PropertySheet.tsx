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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/FormField";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import type { AddressSuggestion } from "@/components/shared/AddressAutocomplete";
import { useCreateProperty, useUpdateProperty } from "@/hooks/useProperties";
import { HOUSE_MODELS, CITIES } from "@/lib/types";
import type { Property, ContractType, PropertyCreateUpdateBody } from "@/lib/types";
import { Building2, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {title}
    </h3>
    {children}
  </div>
);

// ─── Form state ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  address: "",
  houseModel: "",
  city: "",
  baseRent: "",
  contractType: "REGULAR" as ContractType,
};

interface PropertySheetProps {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PropertySheet = ({ open, onClose, property }: PropertySheetProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});

  const create = useCreateProperty();
  const update = useUpdateProperty();
  const isEditing = !!property;
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    const next = property
      ? {
          address: property.address,
          houseModel: property.houseModel,
          city: property.city,
          baseRent: property.baseRent,
          contractType: property.contractType,
        }
      : EMPTY_FORM;
    queueMicrotask(() => {
      setForm(next);
      setErrors({});
    });
  }, [property, open]);

  const validate = (): boolean => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.houseModel) e.houseModel = "Model is required";
    if (!form.city) e.city = "City is required";
    const rent = parseFloat(form.baseRent);
    if (isNaN(rent) || rent <= 0) e.baseRent = "Enter a valid rent amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: PropertyCreateUpdateBody = {
      address: form.address,
      houseModel: form.houseModel,
      city: form.city,
      baseRent: parseFloat(form.baseRent),
      contractType: form.contractType,
    };
    if (isEditing && property) {
      await update.mutateAsync({ id: property.id, body: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const field = <K extends keyof typeof EMPTY_FORM>(key: K) =>
    (val: (typeof EMPTY_FORM)[K]) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              isEditing ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground"
            )}>
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isEditing ? "Edit Property" : "New Property"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {isEditing
                  ? "Update property details"
                  : "Add a property to your portfolio"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Location */}
          <Section title="Location">
            <FormField label="Street Address" required error={errors.address}>
              <AddressAutocomplete
                value={form.address}
                onChange={field("address")}
                onPlaceSelect={(suggestion: AddressSuggestion) => {
                  if (suggestion.city) field("city")(suggestion.city);
                }}
                placeholder="e.g. 123 Main St, LaBelle, FL"
                disabled={isPending}
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="City" required error={errors.city}>
                <Select
                  value={form.city}
                  onValueChange={field("city")}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="House Model" required error={errors.houseModel}>
                <Select
                  value={form.houseModel}
                  onValueChange={field("houseModel")}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUSE_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </Section>

          <Separator />

          {/* Lease Terms */}
          <Section title="Lease Terms">
            <FormField label="Base Monthly Rent (USD)" required error={errors.baseRent}>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.baseRent}
                  onChange={(e) => field("baseRent")(e.target.value)}
                  placeholder="1,200.00"
                  className="pl-9"
                  disabled={isPending}
                />
              </div>
            </FormField>

            <FormField label="Default Contract Type" required>
              <Select
                value={form.contractType}
                onValueChange={(v) => field("contractType")(v as ContractType)}
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
              : "Create Property"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
