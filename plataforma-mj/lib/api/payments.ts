import { api } from "./client";
import type { PaymentRecord, PaymentTransaction, PaymentMethod } from "@/lib/types";

export interface MonthlyTableQuery {
  month: number;
  year: number;
  city?: string;
  search?: string;
}

export interface CreatePaymentRecordPayload {
  tenantId: string;
  propertyId: string;
  contractId?: string;
  billingMonth: number;
  billingYear: number;
  rentAmount: number;
  securityDeposit?: number;
  lastMonthDeposit?: number;
  notes?: string;
}

export interface AddTransactionPayload {
  amount: number;
  transactionDate: string;
  paymentMethod: PaymentMethod;
  receivedBy?: string;
  notes?: string;
}

export interface TenantBillingRow {
  tenantId: string;
  displayName: string;
  email: string;
  phone?: string | null;
  rentAmount: number;
  preferredPayment?: string | null;
  property: { id: string; address: string; city: string };
  contract: { id: string; type: string; startDate: string; endDate: string } | null;
  record: PaymentRecord | null;
  dueDate: string;
  nextDueDate: string;
  daysUntilDue: number;
  lateFeeToday: number;
  totalDueToday: number;
  hasRecord: boolean;
  paymentStatus: string;
}

export const fetchTenantsBilling = async (query: MonthlyTableQuery): Promise<TenantBillingRow[]> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v != null && params.set(k, String(v)));
  const { data, error } = await api.get<{ data: TenantBillingRow[] }>(`/api/payments/tenants-billing?${params}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch billing overview");
  return data.data;
};

export const fetchMonthlyTable = async (query: MonthlyTableQuery): Promise<PaymentRecord[]> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v != null && params.set(k, String(v)));
  const { data, error } = await api.get<{ data: PaymentRecord[] }>(`/api/payments/monthly?${params}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch payments");
  return data.data;
};

export const fetchCollectToday = async (): Promise<PaymentRecord[]> => {
  const { data, error } = await api.get<{ data: PaymentRecord[] }>("/api/payments/collect-today");
  if (error || !data) throw new Error(error ?? "Failed to fetch collect today");
  return data.data;
};

export const fetchPaymentsByTenant = async (tenantId: string): Promise<PaymentRecord[]> => {
  const { data, error } = await api.get<{ data: PaymentRecord[] }>(`/api/payments/tenant/${tenantId}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch tenant payments");
  return data.data;
};

export const fetchPaymentRecord = async (recordId: string): Promise<PaymentRecord> => {
  const { data, error } = await api.get<{ data: PaymentRecord }>(`/api/payments/${recordId}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch payment record");
  return data.data;
};

export const createPaymentRecord = async (body: CreatePaymentRecordPayload): Promise<PaymentRecord> => {
  const { data, error } = await api.post<{ data: PaymentRecord }>("/api/payments", body);
  if (error || !data) throw new Error(error ?? "Failed to create payment record");
  return data.data;
};

export const addTransaction = async (
  recordId: string,
  body: AddTransactionPayload
): Promise<PaymentTransaction> => {
  const { data, error } = await api.post<{ data: PaymentTransaction }>(
    `/api/payments/${recordId}/transactions`,
    body
  );
  if (error || !data) throw new Error(error ?? "Failed to add transaction");
  return data.data;
};

export const deleteTransaction = async (
  recordId: string,
  transactionId: string
): Promise<void> => {
  const { error } = await api.delete(
    `/api/payments/${recordId}/transactions/${transactionId}`
  );
  if (error) throw new Error(error ?? "Failed to delete transaction");
};

export const calculateLateFee = async (
  baseRent: number,
  day: number
): Promise<{ baseRent: number; day: number; lateFee: number; totalDue: number }> => {
  const { data, error } = await api.get<{ data: { baseRent: number; day: number; lateFee: number; totalDue: number } }>(
    `/api/payments/calculate?baseRent=${baseRent}&day=${day}`
  );
  if (error || !data) throw new Error(error ?? "Failed to calculate");
  return data.data;
};
