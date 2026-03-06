import { z } from "zod";

export const updateLateFeeConfigSchema = z.object({
  gracePeriodDays: z.number().int().min(0).max(15),
  flatFeeDay4: z.number().min(0),
  dailyFeeAfter: z.number().min(0),
});

export type UpdateLateFeeConfigInput = z.infer<typeof updateLateFeeConfigSchema>;
