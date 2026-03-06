import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTenants,
  fetchTenant,
  createTenant,
  updateTenant,
  archiveTenant,
  fetchTenantNotes,
  addTenantNote,
  type TenantFilters,
  type CreateTenantPayload,
} from "@/lib/api/tenants";
import { toast } from "sonner";

export const TENANTS_KEY = ["tenants"] as const;

export const useTenants = (filters: TenantFilters = {}) =>
  useQuery({
    queryKey: [...TENANTS_KEY, filters],
    queryFn: () => fetchTenants(filters),
  });

export const useTenant = (id: string) =>
  useQuery({
    queryKey: [...TENANTS_KEY, id],
    queryFn: () => fetchTenant(id),
    enabled: !!id,
  });

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTenantPayload) => createTenant(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANTS_KEY });
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Tenant created. Activation email sent.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateTenant>[1] }) =>
      updateTenant(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANTS_KEY });
      toast.success("Tenant updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useArchiveTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANTS_KEY });
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Tenant archived");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useTenantNotes = (tenantId: string) =>
  useQuery({
    queryKey: [...TENANTS_KEY, tenantId, "notes"],
    queryFn: () => fetchTenantNotes(tenantId),
    enabled: !!tenantId,
  });

export const useAddTenantNote = (tenantId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addTenantNote(tenantId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...TENANTS_KEY, tenantId, "notes"] });
      toast.success("Note added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
