import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLateFeeConfig, updateLateFeeConfig } from "@/lib/api/config";
import { toast } from "sonner";

export const CONFIG_KEY = ["config", "late-fees"] as const;

export const useLateFeeConfig = () =>
  useQuery({
    queryKey: CONFIG_KEY,
    queryFn: fetchLateFeeConfig,
  });

export const useUpdateLateFeeConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLateFeeConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONFIG_KEY });
      toast.success("Late fee configuration saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
