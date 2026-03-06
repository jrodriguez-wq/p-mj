import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMonthlyTable,
  fetchTenantsBilling,
  fetchCollectToday,
  fetchPaymentsByTenant,
  fetchPaymentRecord,
  createPaymentRecord,
  addTransaction,
  deleteTransaction as deleteTransactionApi,
  type MonthlyTableQuery,
  type CreatePaymentRecordPayload,
  type AddTransactionPayload,
} from "@/lib/api/payments";
import { toast } from "sonner";
import type { PaymentRecord } from "@/lib/types";

export const PAYMENTS_KEY = ["payments"] as const;

export const useMonthlyTable = (query: MonthlyTableQuery) =>
  useQuery({
    queryKey: [...PAYMENTS_KEY, "monthly", query],
    queryFn: () => fetchMonthlyTable(query),
  });

export const useTenantsBilling = (query: MonthlyTableQuery) =>
  useQuery({
    queryKey: [...PAYMENTS_KEY, "tenants-billing", query],
    queryFn: () => fetchTenantsBilling(query),
    refetchInterval: 1000 * 60 * 5,
  });

export const useCollectToday = () =>
  useQuery({
    queryKey: [...PAYMENTS_KEY, "collect-today"],
    queryFn: fetchCollectToday,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 min
  });

export const usePaymentsByTenant = (tenantId: string) =>
  useQuery({
    queryKey: [...PAYMENTS_KEY, "tenant", tenantId],
    queryFn: () => fetchPaymentsByTenant(tenantId),
    enabled: !!tenantId,
  });

export const usePaymentRecord = (
  recordId: string,
  options?: { initialData?: PaymentRecord; enabled?: boolean }
) =>
  useQuery({
    queryKey: [...PAYMENTS_KEY, "record", recordId],
    queryFn: () => fetchPaymentRecord(recordId),
    initialData: options?.initialData,
    enabled: (options?.enabled ?? true) && !!recordId,
  });

export const useCreatePaymentRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePaymentRecordPayload) => createPaymentRecord(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment record created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAddTransaction = (recordId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddTransactionPayload) => addTransaction(recordId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteTransaction = (
  recordId: string,
  options?: { onSuccess?: () => void }
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => deleteTransactionApi(recordId, transactionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment removed");
      options?.onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
