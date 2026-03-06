import { z } from "zod";
import { PaymentMethod, ContractType } from "../../../generated/prisma/index.js";

export const createTenantSchema = z.object({
  displayName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  propertyId: z.string().min(1, "Property is required"),
  moveInDate: z.string().date("Invalid move-in date (YYYY-MM-DD)"),
  rentAmount: z.number().positive("Rent amount must be positive"),
  preferredPayment: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().optional(),
  // Contract fields (required when creating tenant)
  contract: z.object({
    type: z.nativeEnum(ContractType),
    startDate: z.string().date("Invalid start date"),
    durationYears: z.number().int().min(1).max(5),
    // RTO fields (required only if type = RTO)
    rtoDetails: z
      .object({
        purchasePrice: z.number().positive(),
        egsFee: z.number().min(0).default(0),
        optionAgreementMonthly: z.number().positive().default(300),
        initialDeposit: z.number().min(0).default(0),
      })
      .optional(),
  }),
});

export const updateTenantSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  rentAmount: z.number().positive().optional(),
  preferredPayment: z.nativeEnum(PaymentMethod).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const tenantFiltersSchema = z.object({
  city: z.string().optional(),
  houseModel: z.string().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantFilters = z.infer<typeof tenantFiltersSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
