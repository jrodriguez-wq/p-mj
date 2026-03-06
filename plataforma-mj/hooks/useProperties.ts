import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  changePropertyStatus,
  archiveProperty,
  type PropertyFilters,
} from "@/lib/api/properties";
import type { PropStatus } from "@/lib/types";
import { toast } from "sonner";

export const PROPERTIES_KEY = ["properties"] as const;

export const useProperties = (filters: PropertyFilters = {}) =>
  useQuery({
    queryKey: [...PROPERTIES_KEY, filters],
    queryFn: () => fetchProperties(filters),
  });

export const useProperty = (id: string) =>
  useQuery({
    queryKey: [...PROPERTIES_KEY, id],
    queryFn: () => fetchProperty(id),
    enabled: !!id,
  });

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success("Property created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProperty>[1] }) =>
      updateProperty(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success("Property updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useChangePropertyStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropStatus }) =>
      changePropertyStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useArchiveProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success("Property archived");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
