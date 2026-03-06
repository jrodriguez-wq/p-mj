import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchContracts,
  fetchContract,
  createContract,
  renewContract,
  updateContract,
  cancelContract,
  deleteContract,
  type ContractFilters,
  type CreateContractPayload,
  type RenewContractPayload,
} from "@/lib/api/contracts";
import { toast } from "sonner";

export const CONTRACTS_KEY = ["contracts"] as const;

export const useContracts = (filters: ContractFilters = {}) =>
  useQuery({
    queryKey: [...CONTRACTS_KEY, filters],
    queryFn: () => fetchContracts(filters),
  });

export const useContract = (id: string) =>
  useQuery({
    queryKey: [...CONTRACTS_KEY, id],
    queryFn: () => fetchContract(id),
    enabled: !!id,
  });

export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateContractPayload) => createContract(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRACTS_KEY });
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Contract created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useRenewContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RenewContractPayload }) =>
      renewContract(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRACTS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Contract renewed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateContract>[1] }) =>
      updateContract(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRACTS_KEY });
      toast.success("Contract updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCancelContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelContract(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRACTS_KEY });
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Contract cancelled");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRACTS_KEY });
      toast.success("Contract permanently deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
