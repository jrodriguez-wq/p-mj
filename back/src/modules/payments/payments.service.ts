import { Prisma, PaymentStatus, PaymentMethod } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/response";
import { calculateLateFeeAmount, calculateTotalDue, projectFees } from "../../utils/lateFees";
import { currentDayOfMonth } from "../../utils/dates";
import type {
  CreatePaymentRecordInput,
  AddTransactionInput,
  MonthlyTableQuery,
} from "./payments.schemas";

// Get the active LateFeeConfig (falls back to defaults)
const getActiveFeeConfig = async () => {
  const config = await prisma.lateFeeConfig.findFirst({ where: { isActive: true } });
  return {
    gracePeriodDays: config?.gracePeriodDays ?? 3,
    flatFeeDay4: Number(config?.flatFeeDay4 ?? 42),
    dailyFeeAfter: Number(config?.dailyFeeAfter ?? 11.35),
  };
};

// Determine PaymentStatus based on paid amount vs expected + fees
const resolvePaymentStatus = (
  amountPaid: number,
  rentAmount: number,
  lateFees: number,
  paymentDay: number | null,
  gracePeriodDays: number
): PaymentStatus => {
  const totalExpected = rentAmount + lateFees;

  if (amountPaid <= 0) return "PENDING";
  if (amountPaid >= totalExpected) {
    return paymentDay && paymentDay > gracePeriodDays ? "PAID_LATE" : "PAID_ON_TIME";
  }
  return "PARTIAL";
};

export const getMonthlyTable = async (query: MonthlyTableQuery) => {
  const { month, year, city, search } = query;
  const feeConfig = await getActiveFeeConfig();
  const today = currentDayOfMonth();

  const where: Prisma.PaymentRecordWhereInput = {
    billingMonth: month,
    billingYear: year,
    tenant: {
      isActive: true,
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { property: { address: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(city && { property: { city: { equals: city, mode: "insensitive" } } }),
    },
  };

  const records = await prisma.paymentRecord.findMany({
    where,
    orderBy: [{ property: { address: "asc" } }],
    include: {
      tenant: {
        select: { id: true, displayName: true, rentAmount: true, preferredPayment: true },
      },
      property: { select: { id: true, address: true, city: true } },
      transactions: { orderBy: { transactionDate: "asc" } },
    },
  });

  // Compute real-time late fee for unpaid/partial records
  const enriched = records.map((r) => {
    const lateFeeToday =
      r.paymentStatus === "PENDING" || r.paymentStatus === "PARTIAL"
        ? calculateLateFeeAmount(today, feeConfig)
        : Number(r.lateFeesAmount);

    return {
      ...r,
      lateFeeToday,
      totalDueToday: Number(r.rentAmount) + lateFeeToday - Number(r.amountPaid),
    };
  });

  return enriched;
};

/**
 * Returns all active tenants with:
 * - Their payment record for the requested month (null if not yet created)
 * - Due date: always the 1st of the billing month
 * - Next due date: 1st of the following month
 * - Days until due / overdue days
 */
export const getTenantsBilling = async (month: number, year: number, city?: string, search?: string) => {
  const feeConfig = await getActiveFeeConfig();
  const today = new Date();

  // Fetch all active tenants with their active contract
  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      ...(city && { property: { city: { equals: city, mode: "insensitive" } } }),
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { property: { address: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    orderBy: { displayName: "asc" },
    include: {
      property: { select: { id: true, address: true, city: true } },
      contracts: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { id: true, type: true, startDate: true, endDate: true },
      },
    },
  });

  // Fetch all payment records for the requested month in one query
  const records = await prisma.paymentRecord.findMany({
    where: {
      billingMonth: month,
      billingYear: year,
      tenant: { isActive: true },
    },
    include: {
      transactions: { orderBy: { transactionDate: "asc" } },
    },
  });

  const recordMap = new Map(records.map((r) => [r.tenantId, r]));

  const msPerDay = 1000 * 60 * 60 * 24;
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDayOfMonth = today.getDate();

  return tenants.map((tenant) => {
    const record = recordMap.get(tenant.id) ?? null;
    const contract = tenant.contracts[0] ?? null;

    // First month of contract: NO late fees. From next month: due on the 1st, fees by day of month (1–3 grace, 4 flat, 5+ daily).
    const contractStart = contract?.startDate ? new Date(contract.startDate) : null;
    const isFirstBillingMonth =
      contractStart &&
      contractStart.getFullYear() === year &&
      contractStart.getMonth() === month - 1;

    const dueDay = 1; // Recurring due date is always the 1st
    const dueDateObj = new Date(year, month - 1, dueDay);
    const dueDate = dueDateObj.toISOString().split("T")[0];

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextDueDate = new Date(nextYear, nextMonth - 1, 1).toISOString().split("T")[0];

    const daysUntilDue = Math.round((dueDateObj.getTime() - todayStart.getTime()) / msPerDay);
    const dueDateHasPassed = todayStart >= dueDateObj;

    let lateFeeToday = 0;
    if (!isFirstBillingMonth && dueDateHasPassed) {
      // From 2nd month: day 1–3 = grace, day 4 = flat $42, day 5+ = flat + $11.35/day
      if (record) {
        const isPending = record.paymentStatus === "PENDING" || record.paymentStatus === "PARTIAL";
        lateFeeToday = isPending
          ? calculateLateFeeAmount(todayDayOfMonth, feeConfig)
          : Number(record.lateFeesAmount);
      } else if (todayDayOfMonth > feeConfig.gracePeriodDays) {
        lateFeeToday = calculateLateFeeAmount(todayDayOfMonth, feeConfig);
      }
    }

    const rentAmount = record ? Number(record.rentAmount) : Number(tenant.rentAmount);
    const amountPaid = record ? Number(record.amountPaid) : 0;
    const totalDueToday = rentAmount + lateFeeToday - amountPaid;

    return {
      tenantId: tenant.id,
      displayName: tenant.displayName,
      email: tenant.email,
      phone: tenant.phone,
      rentAmount,
      preferredPayment: tenant.preferredPayment,
      property: tenant.property,
      contract,
      record,
      dueDate,
      nextDueDate,
      daysUntilDue,
      lateFeeToday,
      totalDueToday: Math.max(0, totalDueToday),
      hasRecord: record !== null,
      paymentStatus: record?.paymentStatus ?? "PENDING",
    };
  });
};

export const getByTenant = async (tenantId: string) => {
  return prisma.paymentRecord.findMany({
    where: { tenantId },
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
    include: { transactions: true },
  });
};

export const getById = async (id: string) => {
  const record = await prisma.paymentRecord.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, displayName: true } },
      property: { select: { id: true, address: true } },
      transactions: { orderBy: { transactionDate: "asc" } },
    },
  });
  if (!record) throw new AppError(404, "Payment record not found");
  return record;
};

export const createRecord = async (
  data: CreatePaymentRecordInput,
  creatorId: string
) => {
  // Check for duplicate (one record per tenant per month)
  const existing = await prisma.paymentRecord.findUnique({
    where: {
      tenantId_billingMonth_billingYear: {
        tenantId: data.tenantId,
        billingMonth: data.billingMonth,
        billingYear: data.billingYear,
      },
    },
  });

  if (existing) {
    throw new AppError(
      409,
      `Payment record already exists for ${data.billingMonth}/${data.billingYear}`
    );
  }

  const record = await prisma.paymentRecord.create({
    data: {
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      contractId: data.contractId,
      billingMonth: data.billingMonth,
      billingYear: data.billingYear,
      rentAmount: data.rentAmount,
      securityDeposit: data.securityDeposit ?? 0,
      lastMonthDeposit: data.lastMonthDeposit ?? 0,
      notes: data.notes,
      createdBy: creatorId,
    },
  });

  return record;
};

export const addTransaction = async (
  recordId: string,
  data: AddTransactionInput,
  userId: string
) => {
  const record = await prisma.paymentRecord.findUnique({
    where: { id: recordId },
    include: {
      transactions: true,
      tenant: {
        select: { id: true },
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
            select: { startDate: true },
          },
        },
      },
    },
  });

  if (!record) throw new AppError(404, "Payment record not found");

  const feeConfig = await getActiveFeeConfig();

  const txDate = new Date(data.transactionDate);
  const { billingMonth, billingYear } = record;
  const contractStart = record.tenant.contracts[0]?.startDate ? new Date(record.tenant.contracts[0].startDate) : null;
  const isFirstBillingMonth =
    contractStart &&
    contractStart.getFullYear() === billingYear &&
    contractStart.getMonth() === billingMonth - 1;

  // First month of contract: no late fees. From 2nd month: day of month (1–3 grace, 4 flat, 5+ daily).
  const txDayOfMonth = txDate.getDate();
  const lateFeeAmount = isFirstBillingMonth ? 0 : calculateLateFeeAmount(txDayOfMonth, feeConfig);
  const effectiveDayForFee = isFirstBillingMonth ? 1 : txDayOfMonth; // for status: first month = on time

  // Create transaction
  const transaction = await prisma.paymentTransaction.create({
    data: {
      paymentRecordId: recordId,
      amount: data.amount,
      transactionDate: txDate,
      paymentMethod: data.paymentMethod,
      receivedBy: data.receivedBy,
      notes: data.notes,
    },
  });

  // Recalculate totals on PaymentRecord
  const allTransactions = [...record.transactions, transaction];
  const totalPaid = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const rentAmount = Number(record.rentAmount);
  const pendingBalance = Math.max(0, rentAmount + lateFeeAmount - totalPaid);
  const status = resolvePaymentStatus(totalPaid, rentAmount, lateFeeAmount, effectiveDayForFee, feeConfig.gracePeriodDays);

  await prisma.paymentRecord.update({
    where: { id: recordId },
    data: {
      amountPaid: totalPaid,
      lateFeesAmount: lateFeeAmount,
      pendingBalance,
      paymentStatus: status,
      paymentDate: txDate,
      paymentMethod: data.paymentMethod,
      receivedBy: data.receivedBy,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "PaymentRecord",
      entityId: recordId,
      action: "UPDATE",
      newValue: { amountPaid: totalPaid, status } as Prisma.InputJsonValue,
    },
  });

  return transaction;
};

/** Delete a transaction and recalculate the payment record totals */
export const deleteTransaction = async (
  recordId: string,
  transactionId: string,
  userId: string
) => {
  const record = await prisma.paymentRecord.findUnique({
    where: { id: recordId },
    include: {
      transactions: { orderBy: { transactionDate: "asc" } },
      tenant: {
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
            select: { startDate: true },
          },
        },
      },
    },
  });

  if (!record) throw new AppError(404, "Payment record not found");

  const tx = record.transactions.find((t) => t.id === transactionId);
  if (!tx) throw new AppError(404, "Transaction not found");

  await prisma.paymentTransaction.delete({ where: { id: transactionId } });

  const remaining = record.transactions.filter((t) => t.id !== transactionId);
  const totalPaid = remaining.reduce((sum, t) => sum + Number(t.amount), 0);
  const rentAmount = Number(record.rentAmount);

  let lateFeesAmount = 0;
  let paymentStatus: "PENDING" | "PARTIAL" | "PAID_ON_TIME" | "PAID_LATE" | "NOT_APPLICABLE" = "PENDING";
  let paymentDate: Date | null = null;
  let paymentMethod: PaymentMethod | null = null;
  let receivedBy: string | null = null;

  if (remaining.length > 0) {
    const feeConfig = await getActiveFeeConfig();
    const lastTx = remaining[remaining.length - 1];
    const lastTxDate = new Date(lastTx.transactionDate);
    const { billingMonth, billingYear } = record;
    const contractStart = record.tenant.contracts[0]?.startDate ? new Date(record.tenant.contracts[0].startDate) : null;
    const isFirstBillingMonth =
      contractStart &&
      contractStart.getFullYear() === billingYear &&
      contractStart.getMonth() === billingMonth - 1;
    const txDayOfMonth = lastTxDate.getDate();
    lateFeesAmount = isFirstBillingMonth ? 0 : calculateLateFeeAmount(txDayOfMonth, feeConfig);
    const effectiveDay = isFirstBillingMonth ? 1 : txDayOfMonth;
    paymentStatus = resolvePaymentStatus(totalPaid, rentAmount, lateFeesAmount, effectiveDay, feeConfig.gracePeriodDays);
    paymentDate = lastTxDate;
    paymentMethod = (lastTx.paymentMethod as PaymentMethod | null) ?? null;
    receivedBy = lastTx.receivedBy ?? null;
  }

  const pendingBalance = Math.max(0, rentAmount + lateFeesAmount - totalPaid);

  await prisma.paymentRecord.update({
    where: { id: recordId },
    data: {
      amountPaid: totalPaid,
      lateFeesAmount,
      pendingBalance,
      paymentStatus,
      paymentDate,
      paymentMethod,
      receivedBy,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "PaymentTransaction",
      entityId: transactionId,
      action: "DELETE",
      oldValue: { amount: tx.amount, transactionDate: tx.transactionDate } as Prisma.InputJsonValue,
    },
  });
};

/** Real-time calculator: returns late fee and total for a given day */
export const calculateForDay = async (baseRent: number, day: number) => {
  const feeConfig = await getActiveFeeConfig();
  return {
    baseRent,
    day,
    ...calculateTotalDue(baseRent, day, feeConfig),
    projection: projectFees(baseRent, 1, 31, feeConfig),
  };
};

/** Cobrador "collect today" view: all unpaid/partial tenants with today's amount */
export const getCollectToday = async () => {
  const feeConfig = await getActiveFeeConfig();
  const todayDay = currentDayOfMonth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dueDateThisMonth = new Date(year, month - 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateHasPassed = todayStart >= dueDateThisMonth;

  const pending = await prisma.paymentRecord.findMany({
    where: {
      billingMonth: month,
      billingYear: year,
      paymentStatus: { in: ["PENDING", "PARTIAL"] },
      tenant: { isActive: true },
    },
    orderBy: { property: { address: "asc" } },
    include: {
      tenant: { select: { id: true, displayName: true, phone: true, preferredPayment: true } },
      property: { select: { id: true, address: true, city: true } },
    },
  });

  return pending.map((r) => {
    const lateFee = dueDateHasPassed ? calculateLateFeeAmount(todayDay, feeConfig) : 0;
    const totalDue = Number(r.rentAmount) + lateFee - Number(r.amountPaid);
    return { ...r, lateFeeToday: lateFee, totalDueToday: Math.max(0, totalDue) };
  });
};
