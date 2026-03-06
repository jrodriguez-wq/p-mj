"use client";

import {
  Building2,
  Users,
  DoorOpen,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { IncomeChart } from "@/components/dashboard/IncomeChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { CollectionProgress } from "@/components/dashboard/CollectionProgress";
import { useDashboardKPIs, useDashboardAlerts } from "@/hooks/useDashboard";
import { useAuthStore } from "@/store/authStore";
import { MONTHS } from "@/lib/types";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();

  const currentMonth = kpis ? `${MONTHS[kpis.payments.month - 1]} ${kpis.payments.year}` : "";

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Good day, {user?.name?.split(" ")[0] ?? "there"} — {currentMonth} overview
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Properties"
          value={kpis?.properties.total ?? "—"}
          sub={`${kpis?.properties.occupied ?? 0} occupied`}
          icon={Building2}
          accent="blue"
          loading={kpiLoading}
        />
        <KpiCard
          label="Active Tenants"
          value={kpis?.tenants.active ?? "—"}
          sub={`${kpis?.properties.rto ?? 0} RTO`}
          icon={Users}
          accent="green"
          loading={kpiLoading}
        />
        <KpiCard
          label="Empty Properties"
          value={kpis?.properties.empty ?? "—"}
          sub="need new tenants"
          icon={DoorOpen}
          accent="amber"
          loading={kpiLoading}
        />
        <KpiCard
          label="Overdue Payments"
          value={kpis?.payments.overdueCount ?? "—"}
          sub={`Late fees: ${fmt(kpis?.payments.totalLateFees ?? 0)}`}
          icon={AlertTriangle}
          accent="red"
          loading={kpiLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Monthly Income"
          value={fmt(kpis?.payments.collected ?? 0)}
          sub={`of ${fmt(kpis?.payments.expected ?? 0)} expected`}
          icon={DollarSign}
          accent="green"
          loading={kpiLoading}
        />
        <KpiCard
          label="Collection Rate"
          value={`${kpis?.payments.collectionRate ?? 0}%`}
          sub={currentMonth}
          icon={TrendingUp}
          accent={
            (kpis?.payments.collectionRate ?? 0) >= 90
              ? "green"
              : (kpis?.payments.collectionRate ?? 0) >= 60
              ? "amber"
              : "red"
          }
          loading={kpiLoading}
        />
        <KpiCard
          label="RTO Properties"
          value={kpis?.properties.rto ?? "—"}
          sub="rent-to-own contracts"
          icon={Clock}
          accent="purple"
          loading={kpiLoading}
        />
        <KpiCard
          label="Sold This Year"
          value={kpis?.properties.soldThisYear ?? "—"}
          sub="properties sold"
          icon={TrendingUp}
          accent="default"
          loading={kpiLoading}
        />
      </div>

      {/* Charts + Alerts */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <IncomeChart data={kpis?.last12Months} loading={kpiLoading} />
          <CollectionProgress
            expected={kpis?.payments.expected}
            collected={kpis?.payments.collected}
            rate={kpis?.payments.collectionRate}
            loading={kpiLoading}
          />
        </div>
        <AlertsPanel alerts={alerts} loading={alertsLoading} />
      </div>
    </div>
  );
}
