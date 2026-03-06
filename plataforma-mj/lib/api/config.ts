import { api } from "./client";

export interface LateFeeConfig {
  id: string | null;
  gracePeriodDays: number;
  flatFeeDay4: number;
  dailyFeeAfter: number;
  isActive: boolean;
}

export const fetchLateFeeConfig = async (): Promise<LateFeeConfig> => {
  const result = await api.get<{ success: boolean; data: LateFeeConfig }>("/api/config/late-fees");
  if (result.error) throw new Error(result.error);
  return result.data!.data;
};

export const updateLateFeeConfig = async (
  body: Omit<LateFeeConfig, "id" | "isActive">
): Promise<LateFeeConfig> => {
  const result = await api.put<{ success: boolean; data: LateFeeConfig }>("/api/config/late-fees", body);
  if (result.error) throw new Error(result.error);
  return result.data!.data;
};
