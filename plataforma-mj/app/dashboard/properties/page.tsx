"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Archive } from "lucide-react";
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
import { PropStatusBadge } from "@/components/shared/StatusBadge";
import { PropertySheet } from "@/components/properties/PropertySheet";
import {
  useProperties,
  useChangePropertyStatus,
  useArchiveProperty,
} from "@/hooks/useProperties";
import { CITIES, PROP_STATUSES, type Property, type PropStatus } from "@/lib/types";

const fmt = (v: string | number) =>
  `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const { data, isLoading } = useProperties({
    search: search || undefined,
    city: cityFilter !== "all" ? cityFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as PropStatus) : undefined,
    page,
    limit: 25,
  });

  const changeStatus = useChangePropertyStatus();
  const archive = useArchiveProperty();

  const handleEdit = (p: Property) => {
    setEditingProperty(p);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setEditingProperty(null);
  };

  const columns: Column<Property>[] = [
    {
      key: "address",
      header: "Address",
      cell: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.address}</p>
          <p className="text-xs text-muted-foreground">{p.city} · {p.houseModel}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <PropStatusBadge status={p.status} />,
    },
    {
      key: "type",
      header: "Type",
      cell: (p) => (
        <Badge variant="outline" className="text-xs">
          {p.contractType}
        </Badge>
      ),
    },
    {
      key: "rent",
      header: "Base Rent",
      cell: (p) => (
        <span className="font-medium text-foreground">{fmt(p.baseRent)}</span>
      ),
    },
    {
      key: "tenants",
      header: "Tenants",
      cell: (p) => (
        <span className="text-muted-foreground">
          {p.tenants?.length ?? 0} active
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Property actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(p)}>
              <Edit className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(["OCCUPIED", "EMPTY", "RESERVED", "RTO"] as PropStatus[])
              .filter((s) => s !== p.status)
              .map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => changeStatus.mutate({ id: p.id, status: s })}
                >
                  Set as {s}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (confirm(`Archive "${p.address}"?`)) archive.mutate(p.id);
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
        title="Properties"
        description={`${data?.total ?? 0} total properties`}
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Property
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search address…"
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROP_STATUSES.filter((s) => s !== "ARCHIVED").map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        keyExtractor={(p) => p.id}
        emptyMessage="No properties found. Create one to get started."
      />

      <PropertySheet
        open={sheetOpen}
        onClose={handleCloseSheet}
        property={editingProperty}
      />
    </div>
  );
}
