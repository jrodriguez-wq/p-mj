import { z } from "zod";
import { ContractType, ContractStatus } from "../../../generated/prisma/index.js";

export const createContractSchema = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  type: z.nativeEnum(ContractType),
  startDate: z.string().date("Invalid start date (YYYY-MM-DD)"),
  durationYears: z.number().int().min(1).max(5),
  notes: z.string().optional(),
  rtoDetails: z
    .object({
      purchasePrice: z.number().positive(),
      egsFee: z.number().min(0).default(0),
      optionAgreementMonthly: z.number().positive().default(300),
      initialDeposit: z.number().min(0).default(0),
    })
    .optional(),
});

export const renewContractSchema = z.object({
  durationYears: z.number().int().min(1).max(5),
  startDate: z.string().date().optional(), // defaults to endDate of current contract
  notes: z.string().optional(),
});

export const contractFiltersSchema = z.object({
  tenantId: z.string().optional(),
  propertyId: z.string().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  type: z.nativeEnum(ContractType).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;
export type ContractFilters = z.infer<typeof contractFiltersSchema>;
