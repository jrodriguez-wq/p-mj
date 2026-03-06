import { z } from "zod";
import { PropStatus, ContractType } from "../../../generated/prisma/index.js";

export const createPropertySchema = z.object({
  address: z.string().min(5, "Address is required"),
  houseModel: z.string().min(1, "House model is required"),
  city: z.string().min(1, "City is required"),
  baseRent: z.number().positive("Base rent must be positive"),
  status: z.nativeEnum(PropStatus).optional().default("EMPTY"),
  contractType: z.nativeEnum(ContractType).optional().default("REGULAR"),
});

export const updatePropertySchema = createPropertySchema.partial();

export const propertyFiltersSchema = z.object({
  city: z.string().optional(),
  houseModel: z.string().optional(),
  status: z.nativeEnum(PropStatus).optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(PropStatus),
  notes: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
