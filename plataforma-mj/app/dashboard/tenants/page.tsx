"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, Edit, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContractStatusBadge } from "@/components/shared/StatusBadge";
import { TenantSheet } from "@/components/tenants/TenantSheet";
import { useTenants, useArchiveTenant } from "@/hooks/useTenants";
import { CITIES, type Tenant } from "@/lib/types";

const fmt = (v: string | number) =>
  `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function TenantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const { data, isLoading } = useTenants({
    search: search || undefined,
    city: cityFilter !== "all" ? cityFilter : undefined,
    page: 1,
    limit: 50,
  });

  const archive = useArchiveTenant();

  const handleEdit = (t: Tenant) => {
    setEditingTenant(t);
    setSheetOpen(true);
  };

  const handleView = (t: Tenant) => {
    router.push(`/dashboard/tenants/${t.id}`);
  };

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: "Tenant",
      cell: (t) => (
        <div>
          <p className="font-medium text-foreground">{t.displayName}</p>
          <p className="text-xs text-muted-foreground">{t.email}</p>
        </div>
      ),
    },
    {
      key: "property",
      header: "Property",
      cell: (t) => (
        <div>
          <p className="text-sm text-foreground">{t.property?.address}</p>
          <p className="text-xs text-muted-foreground">{t.property?.city}</p>
        </div>
      ),
    },
    {
      key: "contract",
      header: "Contract",
      cell: (t) => {
        const contract = t.contracts?.[0];
        return contract ? (
          <div className="flex items-center gap-2">
            <ContractStatusBadge status={contract.status} />
            <Badge variant="outline" className="text-xs">
              {contract.type}
            </Badge>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "rent",
      header: "Rent",
      cell: (t) => (
        <span className="font-medium text-foreground">{fmt(t.rentAmount)}/mo</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (t) => (
        <span className="text-muted-foreground">{t.phone ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Tenant actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(t)}>
              <Eye className="mr-2 h-3.5 w-3.5" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(t)}>
              <Edit className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (confirm(`Archive tenant "${t.displayName}"?`)) {
                  archive.mutate(t.id);
                }
              }}
            >
              <Archive className="mr-2 h-3.5 w-3.5" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-6 md:p-8">
      <PageHeader
        title="Tenants"
        description={`${data?.total ?? 0} active tenants`}
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Tenant
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        keyExtractor={(t) => t.id}
        onRowClick={handleView}
        emptyMessage="No active tenants found."
      />

      <TenantSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditingTenant(null); }}
        tenant={editingTenant}
      />
    </div>
  );
}
