import { api } from "./client";
import type { Tenant, TenantNote, PaginatedResponse, ContractType, PaymentMethod } from "@/lib/types";

export interface TenantFilters {
  city?: string;
  houseModel?: string;
  contractType?: ContractType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTenantPayload {
  displayName: string;
  email: string;
  phone?: string;
  propertyId: string;
  moveInDate: string;
  rentAmount: number;
  preferredPayment?: PaymentMethod;
  notes?: string;
  contract: {
    type: ContractType;
    startDate: string;
    durationYears: number;
    rtoDetails?: {
      purchasePrice: number;
      egsFee?: number;
      optionAgreementMonthly?: number;
      initialDeposit?: number;
    };
  };
}

export const fetchTenants = async (filters: TenantFilters = {}): Promise<PaginatedResponse<Tenant>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v != null && params.set(k, String(v)));
  const { data, error } = await api.get<{ data: PaginatedResponse<Tenant> }>(`/api/tenants?${params}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch tenants");
  return data.data;
};

export const fetchTenant = async (id: string): Promise<Tenant> => {
  const { data, error } = await api.get<{ data: Tenant }>(`/api/tenants/${id}`);
  if (error || !data) throw new Error(error ?? "Tenant not found");
  return data.data;
};

export const createTenant = async (body: CreateTenantPayload): Promise<Tenant> => {
  const { data, error } = await api.post<{ data: Tenant }>("/api/tenants", body);
  if (error || !data) throw new Error(error ?? "Failed to create tenant");
  return data.data;
};

export const updateTenant = async (id: string, body: Partial<Tenant>): Promise<Tenant> => {
  const { data, error } = await api.put<{ data: Tenant }>(`/api/tenants/${id}`, body);
  if (error || !data) throw new Error(error ?? "Failed to update tenant");
  return data.data;
};

export const archiveTenant = async (id: string): Promise<void> => {
  const { error } = await api.delete(`/api/tenants/${id}`);
  if (error) throw new Error(error);
};

export const fetchTenantNotes = async (tenantId: string): Promise<TenantNote[]> => {
  const { data, error } = await api.get<{ data: TenantNote[] }>(`/api/tenants/${tenantId}/notes`);
  if (error || !data) throw new Error(error ?? "Failed to fetch notes");
  return data.data;
};

export const addTenantNote = async (tenantId: string, content: string): Promise<TenantNote> => {
  const { data, error } = await api.post<{ data: TenantNote }>(`/api/tenants/${tenantId}/notes`, { content });
  if (error || !data) throw new Error(error ?? "Failed to add note");
  return data.data;
};
