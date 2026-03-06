import { useQuery } from "@tanstack/react-query";
import { fetchKPIs, fetchAlerts } from "@/lib/api/dashboard";

export const useDashboardKPIs = () =>
  useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: fetchKPIs,
    staleTime: 1000 * 60 * 2, // 2 min
  });

export const useDashboardAlerts = () =>
  useQuery({
    queryKey: ["dashboard", "alerts"],
    queryFn: fetchAlerts,
    staleTime: 1000 * 60 * 2,
  });
