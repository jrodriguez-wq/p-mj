"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Archive, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { TenantNotes } from "@/components/tenants/TenantNotes";
import { TenantSheet } from "@/components/tenants/TenantSheet";
import { useTenant, useArchiveTenant } from "@/hooks/useTenants";
import { format } from "date-fns";
import { useState } from "react";
import { MONTHS } from "@/lib/types";

const fmt = (v: string | number) =>
  `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(id);
  const archive = useArchiveTenant();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center p-20 text-muted-foreground">
        Tenant not found.
      </div>
    );
  }

  const activeContract = tenant.contracts?.find((c) => c.status === "ACTIVE");

  return (
    <div className="space-y-5 p-6 md:p-8">
      {/* Back + Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {tenant.displayName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tenant.property?.address} · {tenant.property?.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Archive tenant "${tenant.displayName}"?`)) {
                archive.mutate(tenant.id, { onSuccess: () => router.push("/dashboard/tenants") });
              }
            }}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            Archive
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments ({tenant.paymentRecords?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="contracts">Contracts ({tenant.contracts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Info */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{tenant.email}</span>
                </div>
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{tenant.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{tenant.property?.address}, {tenant.property?.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    Move-in: {format(new Date(tenant.moveInDate), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Lease Info */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Lease
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-semibold text-foreground">{fmt(tenant.rentAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preferred Payment</span>
                  <Badge variant="outline" className="text-xs">
                    {tenant.preferredPayment?.replace(/_/g, " ") ?? "—"}
                  </Badge>
                </div>
                {activeContract && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contract Status</span>
                      <ContractStatusBadge status={activeContract.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contract Type</span>
                      <Badge variant="outline" className="text-xs">{activeContract.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="font-medium">
                        {format(new Date(activeContract.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              {(tenant.paymentRecords?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  No payment records found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tenant.paymentRecords?.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {MONTHS[r.billingMonth - 1]} {r.billingYear}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {fmt(r.amountPaid)} of {fmt(r.rentAmount)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={r.paymentStatus} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts */}
        <TabsContent value="contracts" className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              {(tenant.contracts?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  No contracts found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tenant.contracts?.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ContractStatusBadge status={c.status} />
                          <Badge variant="outline" className="text-xs">{c.type}</Badge>
                          {c.renewalNumber > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Renewal #{c.renewalNumber}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(c.startDate), "MMM d, yyyy")} →{" "}
                          {format(new Date(c.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      {c.rtoDetail && (
                        <div className="text-right">
                          <p className="text-xs text-purple-400 font-medium">RTO</p>
                          <p className="text-xs text-muted-foreground">
                            {fmt(c.rtoDetail.totalSalePrice)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <TenantNotes tenantId={id} />
        </TabsContent>
      </Tabs>

      <TenantSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        tenant={tenant}
      />
    </div>
  );
}
