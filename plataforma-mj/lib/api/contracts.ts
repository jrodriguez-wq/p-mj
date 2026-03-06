import { api } from "./client";
import type { Contract, PaginatedResponse, ContractType, ContractStatus } from "@/lib/types";

export interface ContractFilters {
  status?: ContractStatus;
  type?: ContractType;
  tenantId?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
}

export interface CreateContractPayload {
  tenantId: string;
  propertyId: string;
  type: ContractType;
  startDate: string;
  durationYears: number;
  notes?: string;
  rtoDetails?: {
    purchasePrice: number;
    egsFee?: number;
    optionAgreementMonthly?: number;
    initialDeposit?: number;
  };
}

export interface RenewContractPayload {
  startDate: string;
  durationYears: number;
  notes?: string;
}

export const fetchContracts = async (filters: ContractFilters = {}): Promise<PaginatedResponse<Contract>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v != null && params.set(k, String(v)));
  // Backend returns { success: true, data: Contract[] } (flat array, not paginated)
  const { data, error } = await api.get<{ success: boolean; data: Contract[] }>(`/api/contracts?${params}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch contracts");
  const contracts = data.data ?? [];
  return {
    data: contracts,
    total: contracts.length,
    page: 1,
    totalPages: 1,
  };
};

export const fetchContract = async (id: string): Promise<Contract> => {
  const { data, error } = await api.get<{ success: boolean; data: Contract }>(`/api/contracts/${id}`);
  if (error || !data) throw new Error(error ?? "Contract not found");
  return data.data;
};

export const createContract = async (body: CreateContractPayload): Promise<Contract> => {
  const { data, error } = await api.post<{ data: Contract }>("/api/contracts", body);
  if (error || !data) throw new Error(error ?? "Failed to create contract");
  return data.data;
};

export const renewContract = async (id: string, body: RenewContractPayload): Promise<Contract> => {
  const { data, error } = await api.post<{ data: Contract }>(`/api/contracts/${id}/renew`, body);
  if (error || !data) throw new Error(error ?? "Failed to renew contract");
  return data.data;
};

export const updateContract = async (id: string, body: Partial<Contract>): Promise<Contract> => {
  const { data, error } = await api.put<{ data: Contract }>(`/api/contracts/${id}`, body);
  if (error || !data) throw new Error(error ?? "Failed to update contract");
  return data.data;
};

export const cancelContract = async (id: string): Promise<Contract> => {
  const { data, error } = await api.patch<{ success: boolean; data: Contract }>(`/api/contracts/${id}/cancel`, {});
  if (error || !data) throw new Error(error ?? "Failed to cancel contract");
  return data.data;
};

export const deleteContract = async (id: string): Promise<void> => {
  const { error } = await api.delete<{ success: boolean }>(`/api/contracts/${id}`);
  if (error) throw new Error(error ?? "Failed to delete contract");
};
