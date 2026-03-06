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
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/shared/FormField";
import { useCreateContract } from "@/hooks/useContracts";
import { useProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import type { ContractType, Tenant, Property } from "@/lib/types";
import type { CreateContractPayload } from "@/lib/api/contracts";
import { FileText, Loader2, Search, Building2, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Searchable select ────────────────────────────────────────────────────────

interface SearchSelectProps<T> {
  items: T[];
  value: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  placeholder: string;
  renderItem: (item: T) => React.ReactNode;
  renderSelected: (item: T) => React.ReactNode;
  getId: (item: T) => string;
  filterFn: (item: T, q: string) => boolean;
  loading?: boolean;
}

function SearchSelect<T>({
  items,
  value,
  onSelect,
  disabled,
  placeholder,
  renderItem,
  renderSelected,
  getId,
  filterFn,
  loading,
}: SearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = items.find((it) => getId(it) === value);
  const filtered = query.trim()
    ? items.filter((it) => filterFn(it, query))
    : items;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm ring-offset-background transition-colors",
          "hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        aria-expanded={open}
      >
        {selected ? (
          <span className="flex-1 text-left">{renderSelected(selected)}</span>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Type to filter…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">No results</li>
            ) : (
              filtered.map((it) => (
                <li
                  key={getId(it)}
                  onClick={() => { onSelect(getId(it)); setOpen(false); setQuery(""); }}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-accent",
                    getId(it) === value && "bg-accent/60"
                  )}
                >
                  {renderItem(it)}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Contract form ────────────────────────────────────────────────────────────

const EMPTY: CreateContractPayload = {
  tenantId: "",
  propertyId: "",
  type: "REGULAR",
  startDate: "",
  durationYears: 1,
  notes: "",
};

interface ContractSheetProps {
  open: boolean;
  onClose: () => void;
  prefilledTenantId?: string;
  prefilledPropertyId?: string;
}

export const ContractSheet = ({
  open,
  onClose,
  prefilledTenantId,
  prefilledPropertyId,
}: ContractSheetProps) => {
  const [form, setForm] = useState<CreateContractPayload>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useCreateContract();
  const { data: propertiesData, isLoading: propsLoading } = useProperties({ limit: 100 });
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({ limit: 100 });

  const properties = propertiesData?.data ?? [];
  const tenants = tenantsData?.data ?? [];

  // Only show OCCUPIED or EMPTY properties (not archived)
  const availableProperties = properties.filter(
    (p) => p.isActive && (p.status === "OCCUPIED" || p.status === "EMPTY" || p.status === "RESERVED" || p.status === "RTO")
  );
  const activeTenants = tenants.filter((t) => t.isActive);

  useEffect(() => {
    setForm({
      ...EMPTY,
      tenantId: prefilledTenantId ?? "",
      propertyId: prefilledPropertyId ?? "",
    });
    setErrors({});
  }, [open, prefilledTenantId, prefilledPropertyId]);

  // When a tenant is selected, pre-fill the property they live in
  const handleTenantSelect = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    setForm((f) => ({
      ...f,
      tenantId,
      propertyId: tenant?.propertyId || f.propertyId,
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.tenantId) e.tenantId = "Tenant is required";
    if (!form.propertyId) e.propertyId = "Property is required";
    if (!form.startDate) e.startDate = "Start date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await create.mutateAsync(form);
    onClose();
  };

  const isPending = create.isPending;
  const selectedTenant = tenants.find((t) => t.id === form.tenantId);
  const selectedProperty = properties.find((p) => p.id === form.propertyId);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {/* Header */}
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base">New Contract</SheetTitle>
              <SheetDescription className="text-xs">
                Create a lease agreement between a tenant and a property
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Parties */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Parties
            </h3>

            {/* Tenant */}
            <FormField label="Tenant" required error={errors.tenantId}>
              {prefilledTenantId && selectedTenant ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedTenant.displayName}</p>
                    <p className="text-xs text-muted-foreground">{selectedTenant.email}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px]">Pre-filled</Badge>
                </div>
              ) : (
                <SearchSelect<Tenant>
                  items={activeTenants}
                  value={form.tenantId}
                  onSelect={handleTenantSelect}
                  disabled={isPending}
                  placeholder="Search tenant by name…"
                  getId={(t) => t.id}
                  filterFn={(t, q) =>
                    t.displayName.toLowerCase().includes(q.toLowerCase()) ||
                    (t.email ?? "").toLowerCase().includes(q.toLowerCase())
                  }
                  loading={tenantsLoading}
                  renderItem={(t) => (
                    <div>
                      <p className="font-medium">{t.displayName}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </div>
                  )}
                  renderSelected={(t) => (
                    <span className="font-medium">{t.displayName}</span>
                  )}
                />
              )}
            </FormField>

            {/* Property */}
            <FormField label="Property" required error={errors.propertyId}>
              {prefilledPropertyId && selectedProperty ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedProperty.address}</p>
                    <p className="text-xs text-muted-foreground">{selectedProperty.city}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px]">Pre-filled</Badge>
                </div>
              ) : (
                <SearchSelect<Property>
                  items={availableProperties}
                  value={form.propertyId}
                  onSelect={(id) => setForm((f) => ({ ...f, propertyId: id }))}
                  disabled={isPending}
                  placeholder="Search property by address…"
                  getId={(p) => p.id}
                  filterFn={(p, q) =>
                    p.address.toLowerCase().includes(q.toLowerCase()) ||
                    p.city.toLowerCase().includes(q.toLowerCase())
                  }
                  loading={propsLoading}
                  renderItem={(p) => (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{p.address}</p>
                        <p className="text-xs text-muted-foreground">{p.city} · {p.houseModel}</p>
                      </div>
                      <Badge variant="outline" className={cn("shrink-0 text-[10px]",
                        p.status === "OCCUPIED" ? "text-blue-500 border-blue-500/30" :
                        p.status === "EMPTY"    ? "text-emerald-500 border-emerald-500/30" : ""
                      )}>
                        {p.status}
                      </Badge>
                    </div>
                  )}
                  renderSelected={(p) => (
                    <span className="font-medium">{p.address} · {p.city}</span>
                  )}
                />
              )}
            </FormField>

            {/* Preview card when both selected */}
            {selectedTenant && selectedProperty && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                  Contract Summary
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{selectedTenant.displayName}</p>
                    <p className="text-xs text-muted-foreground">{selectedProperty.address}, {selectedProperty.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Base rent</p>
                    <p className="text-sm font-semibold text-foreground">
                      ${Number(selectedProperty.baseRent).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Terms */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contract Terms
            </h3>

            <FormField label="Contract Type" required>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as ContractType }))}
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
              <FormField label="Start Date" required error={errors.startDate}>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  disabled={isPending}
                />
              </FormField>
              <FormField label="Duration (years)" required>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.durationYears}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationYears: parseInt(e.target.value) || 1 }))
                  }
                  disabled={isPending}
                />
              </FormField>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Notes
            </h3>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Optional internal notes about this contract…"
              disabled={isPending}
            />
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
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating…" : "Create Contract"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
