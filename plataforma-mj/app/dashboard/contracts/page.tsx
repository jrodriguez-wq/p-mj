"use client";

import { useState } from "react";
import {
  Plus, RefreshCw, MoreHorizontal,
  Info, Users, Building2, FileText as FileTextIcon,
  XCircle, AlertTriangle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContractStatusBadge } from "@/components/shared/StatusBadge";
import { ContractSheet } from "@/components/contracts/ContractSheet";
import { RenewDialog } from "@/components/contracts/RenewDialog";
import { useContracts, useCancelContract, useDeleteContract } from "@/hooks/useContracts";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import type { Contract, ContractStatus } from "@/lib/types";

const CONTRACT_STATUSES: ContractStatus[] = ["ACTIVE", "EXPIRED", "RENEWED", "CANCELLED"];

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Contract | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);

  const user = useAuthStore((s) => s.user);
  const canDelete = user?.role === "OWNER" || user?.role === "ADMIN";

  const { data, isLoading } = useContracts({
    status: statusFilter !== "all" ? (statusFilter as ContractStatus) : undefined,
    page: 1,
    limit: 50,
  });

  const cancel = useCancelContract();
  const remove = useDeleteContract();

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    await cancel.mutateAsync(cancelTarget.id);
    setCancelTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: Column<Contract>[] = [
    {
      key: "tenant",
      header: "Tenant",
      cell: (c) => (
        <span className="font-medium text-foreground">
          {c.tenant?.displayName ?? c.tenantId}
        </span>
      ),
    },
    {
      key: "property",
      header: "Property",
      cell: (c) => (
        <div>
          <p className="text-sm">{c.property?.address}</p>
          <p className="text-xs text-muted-foreground">{c.property?.city}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (c) => (
        <Badge variant="outline" className="text-xs">{c.type}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => <ContractStatusBadge status={c.status} />,
    },
    {
      key: "dates",
      header: "Period",
      cell: (c) => (
        <div className="text-xs text-muted-foreground">
          <p>{format(new Date(c.startDate), "MMM d, yyyy")}</p>
          <p>→ {format(new Date(c.endDate), "MMM d, yyyy")}</p>
        </div>
      ),
    },
    {
      key: "renewal",
      header: "Renewal",
      cell: (c) => (
        <span className="text-xs text-muted-foreground">
          {c.renewalNumber === 0 ? "Original" : `#${c.renewalNumber}`}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Contract actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {c.status === "ACTIVE" && (
              <>
                <DropdownMenuItem onClick={() => setRenewTarget(c)}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Renew Contract
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setCancelTarget(c)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-3.5 w-3.5" />
                  Cancel Contract
                </DropdownMenuItem>
              </>
            )}
            {c.status === "CANCELLED" && canDelete && (
              <DropdownMenuItem
                onClick={() => setDeleteTarget(c)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Permanently
              </DropdownMenuItem>
            )}
            {c.status !== "ACTIVE" && c.status !== "CANCELLED" && (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                No actions available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-6 md:p-8">
      <PageHeader
        title="Contracts"
        description={`${data?.total ?? 0} contracts`}
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Contract
          </Button>
        }
      />

      {/* Flow guide */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Recommended workflow</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When you create a <strong>Tenant</strong> a contract is automatically generated.
            Use <span className="font-medium text-foreground">New Contract</span> only to add a second contract
            (e.g. lease renewal, RTO conversion) to an existing tenant–property pair.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <Building2 className="h-3 w-3" />1. Create Property
            </span>
            <span className="text-muted-foreground/40">→</span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <Users className="h-3 w-3" />2. Create Tenant (contract auto-created)
            </span>
            <span className="text-muted-foreground/40">→</span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <FileTextIcon className="h-3 w-3" />3. Renew / manage here
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CONTRACT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        keyExtractor={(c) => c.id}
        emptyMessage="No contracts found."
      />

      <ContractSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {renewTarget && (
        <RenewDialog
          open={!!renewTarget}
          onClose={() => setRenewTarget(null)}
          contract={renewTarget}
        />
      )}

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Cancel this contract?</DialogTitle>
                <DialogDescription className="mt-0.5">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
            <p className="text-muted-foreground">
              Tenant:{" "}
              <span className="font-medium text-foreground">
                {cancelTarget?.tenant?.displayName}
              </span>
            </p>
            <p className="text-muted-foreground">
              Property:{" "}
              <span className="font-medium text-foreground">
                {cancelTarget?.property?.address}
              </span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            The contract status will change to <strong className="text-destructive">CANCELLED</strong> and
            no new payments can be linked to it.
          </p>

          <DialogFooter className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancel.isPending}>
              Keep Contract
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? "Cancelling…" : "Yes, Cancel Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete this contract?</DialogTitle>
                <DialogDescription className="mt-0.5">
                  This will permanently remove it from the system.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
            <p className="text-muted-foreground">
              Tenant:{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.tenant?.displayName}
              </span>
            </p>
            <p className="text-muted-foreground">
              Property:{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.property?.address}
              </span>
            </p>
            <p className="text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground">{deleteTarget?.status}</span>
            </p>
          </div>

          <p className="text-xs text-destructive/80 font-medium">
            ⚠ This action is irreversible and only available to admins and owners.
          </p>

          <DialogFooter className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={remove.isPending}>
              Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
