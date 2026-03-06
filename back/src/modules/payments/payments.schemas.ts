import { z } from "zod";
import { PaymentMethod } from "../../../generated/prisma/index.js";

export const createPaymentRecordSchema = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  contractId: z.string().optional(),
  billingMonth: z.number().int().min(1).max(12),
  billingYear: z.number().int().min(2000).max(2100),
  rentAmount: z.number().positive(),
  securityDeposit: z.number().min(0).default(0),
  lastMonthDeposit: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const addTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  transactionDate: z.string().date("Invalid date (YYYY-MM-DD)"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const monthlyTableSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
  city: z.string().optional(),
  search: z.string().optional(),
});

export const lateFeeCalculatorSchema = z.object({
  baseRent: z.coerce.number().positive(),
  day: z.coerce.number().int().min(1).max(31),
});

export type CreatePaymentRecordInput = z.infer<typeof createPaymentRecordSchema>;
export type AddTransactionInput = z.infer<typeof addTransactionSchema>;
export type MonthlyTableQuery = z.infer<typeof monthlyTableSchema>;
