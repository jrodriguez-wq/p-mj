import { api } from "./client";
import type { DashboardKPIs, DashboardAlerts } from "@/lib/types";

export const fetchKPIs = async (): Promise<DashboardKPIs> => {
  const { data, error } = await api.get<{ data: DashboardKPIs }>("/api/dashboard/kpis");
  if (error || !data) throw new Error(error ?? "Failed to fetch KPIs");
  return data.data;
};

export const fetchAlerts = async (): Promise<DashboardAlerts> => {
  const { data, error } = await api.get<{ data: DashboardAlerts }>("/api/dashboard/alerts");
  if (error || !data) throw new Error(error ?? "Failed to fetch alerts");
  return data.data;
};
