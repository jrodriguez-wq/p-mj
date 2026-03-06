import { api } from "./client";
import type { Property, PaginatedResponse, PropStatus, PropertyCreateUpdateBody } from "@/lib/types";

export interface PropertyFilters {
  city?: string;
  houseModel?: string;
  status?: PropStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const fetchProperties = async (filters: PropertyFilters = {}): Promise<PaginatedResponse<Property>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v != null && params.set(k, String(v)));
  const { data, error } = await api.get<{ data: PaginatedResponse<Property> }>(`/api/properties?${params}`);
  if (error || !data) throw new Error(error ?? "Failed to fetch properties");
  return data.data;
};

export const fetchProperty = async (id: string): Promise<Property> => {
  const { data, error } = await api.get<{ data: Property }>(`/api/properties/${id}`);
  if (error || !data) throw new Error(error ?? "Property not found");
  return data.data;
};

export const createProperty = async (body: PropertyCreateUpdateBody): Promise<Property> => {
  const { data, error } = await api.post<{ data: Property }>("/api/properties", body);
  if (error || !data) throw new Error(error ?? "Failed to create property");
  return data.data;
};

export const updateProperty = async (id: string, body: PropertyCreateUpdateBody): Promise<Property> => {
  const { data, error } = await api.put<{ data: Property }>(`/api/properties/${id}`, body);
  if (error || !data) throw new Error(error ?? "Failed to update property");
  return data.data;
};

export const changePropertyStatus = async (id: string, status: PropStatus): Promise<Property> => {
  const { data, error } = await api.patch<{ data: Property }>(`/api/properties/${id}/status`, { status });
  if (error || !data) throw new Error(error ?? "Failed to change status");
  return data.data;
};

export const archiveProperty = async (id: string): Promise<void> => {
  const { error } = await api.delete(`/api/properties/${id}`);
  if (error) throw new Error(error);
};
