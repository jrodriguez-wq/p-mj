import { api } from "./client";
import type { UserProfile, UserRole } from "@/lib/types";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "TENANT">;
}

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await api.get<{ data: UserProfile[] }>("/api/users");
  if (error || !data) throw new Error(error ?? "Failed to fetch users");
  return data.data;
};

export const createUser = async (body: CreateUserPayload): Promise<UserProfile> => {
  const { data, error } = await api.post<{ data: UserProfile }>("/api/users", body);
  if (error || !data) throw new Error(error ?? "Failed to create user");
  return data.data;
};

export const updateUser = async (
  id: string,
  body: { name?: string; role?: Exclude<UserRole, "TENANT"> }
): Promise<UserProfile> => {
  const { data, error } = await api.put<{ data: UserProfile }>(`/api/users/${id}`, body);
  if (error || !data) throw new Error(error ?? "Failed to update user");
  return data.data;
};

export const deactivateUser = async (id: string): Promise<void> => {
  const { error } = await api.delete(`/api/users/${id}`);
  if (error) throw new Error(error);
};
