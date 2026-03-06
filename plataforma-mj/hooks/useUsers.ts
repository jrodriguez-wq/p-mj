import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  createUser,
  updateUser,
  deactivateUser,
  type CreateUserPayload,
} from "@/lib/api/users";
import { toast } from "sonner";

export const USERS_KEY = ["users"] as const;

export const useUsers = () =>
  useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchUsers,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserPayload) => createUser(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success("User created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success("User updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success("User deactivated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
