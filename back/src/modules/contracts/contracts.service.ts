import { Prisma } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/response";
import { calcContractEndDate, daysUntil } from "../../utils/dates";
import type {
  CreateContractInput,
  RenewContractInput,
  ContractFilters,
} from "./contracts.schemas";

export const findAll = async (filters: ContractFilters) => {
  const where: Prisma.ContractWhereInput = {
    ...(filters.tenantId && { tenantId: filters.tenantId }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
  };

  return prisma.contract.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      tenant: { select: { id: true, displayName: true, email: true } },
      property: { select: { id: true, address: true, city: true } },
      rtoDetail: true,
      parentContract: { select: { id: true, renewalNumber: true, status: true } },
      renewals: { select: { id: true, renewalNumber: true, status: true, startDate: true, endDate: true } },
    },
  });
};

export const findById = async (id: string) => {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, displayName: true, email: true } },
      property: { select: { id: true, address: true, city: true } },
      rtoDetail: true,
      parentContract: true,
      renewals: { orderBy: { renewalNumber: "asc" } },
    },
  });

  if (!contract) throw new AppError(404, "Contract not found");

  const daysRemaining = daysUntil(contract.endDate);
  return { ...contract, daysRemaining };
};

export const create = async (data: CreateContractInput, userId: string) => {
  // Guard: a tenant can only have one ACTIVE contract at a time
  const existingActive = await prisma.contract.findFirst({
    where: { tenantId: data.tenantId, status: "ACTIVE" },
  });
  if (existingActive) {
    throw new AppError(
      409,
      "This tenant already has an active contract. Renew or cancel it before creating a new one."
    );
  }

  const startDate = new Date(data.startDate);
  const endDate = calcContractEndDate(startDate, data.durationYears);

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        tenantId: data.tenantId,
        propertyId: data.propertyId,
        type: data.type,
        startDate,
        durationYears: data.durationYears,
        endDate,
        status: "ACTIVE",
        renewalNumber: 0,
        notes: data.notes,
      },
    });

    if (data.type === "RTO" && data.rtoDetails) {
      const rto = data.rtoDetails;
      await tx.rTODetail.create({
        data: {
          contractId: c.id,
          purchasePrice: rto.purchasePrice,
          egsFee: rto.egsFee ?? 0,
          totalSalePrice: rto.purchasePrice + (rto.egsFee ?? 0),
          optionAgreementMonthly: rto.optionAgreementMonthly ?? 300,
          initialDeposit: rto.initialDeposit ?? 0,
        },
      });
    }

    return c;
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Contract",
      entityId: contract.id,
      action: "CREATE",
      newValue: { type: contract.type, startDate, endDate } as Prisma.InputJsonValue,
    },
  });

  return contract;
};

export const renew = async (
  id: string,
  data: RenewContractInput,
  userId: string
) => {
  const existing = await prisma.contract.findUnique({
    where: { id },
    include: { rtoDetail: true },
  });

  if (!existing) throw new AppError(404, "Contract not found");

  if (existing.status === "RENEWED") {
    throw new AppError(409, "Contract has already been renewed");
  }

  const startDate = data.startDate
    ? new Date(data.startDate)
    : existing.endDate;

  const endDate = calcContractEndDate(startDate, data.durationYears);

  const renewed = await prisma.$transaction(async (tx) => {
    // Mark current contract as RENEWED
    await tx.contract.update({ where: { id }, data: { status: "RENEWED" } });

    // Create new contract (chained to the old one)
    const newContract = await tx.contract.create({
      data: {
        tenantId: existing.tenantId,
        propertyId: existing.propertyId,
        type: existing.type,
        startDate,
        durationYears: data.durationYears,
        endDate,
        status: "ACTIVE",
        renewalNumber: existing.renewalNumber + 1,
        parentContractId: id,
        notes: data.notes,
      },
    });

    // Carry over RTO details if applicable
    if (existing.type === "RTO" && existing.rtoDetail) {
      await tx.rTODetail.create({
        data: {
          contractId: newContract.id,
          purchasePrice: existing.rtoDetail.purchasePrice,
          egsFee: existing.rtoDetail.egsFee,
          totalSalePrice: existing.rtoDetail.totalSalePrice,
          optionAgreementMonthly: existing.rtoDetail.optionAgreementMonthly,
          initialDeposit: existing.rtoDetail.initialDeposit,
        },
      });
    }

    return newContract;
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Contract",
      entityId: renewed.id,
      action: "CREATE",
      newValue: {
        renewalNumber: renewed.renewalNumber,
        parentContractId: id,
      } as Prisma.InputJsonValue,
    },
  });

  return renewed;
};

export const cancel = async (id: string, userId: string) => {
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Contract not found");

  if (existing.status !== "ACTIVE") {
    throw new AppError(409, "Only active contracts can be cancelled");
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Contract",
      entityId: id,
      action: "STATUS_CHANGE",
      oldValue: { status: "ACTIVE" } as Prisma.InputJsonValue,
      newValue: { status: "CANCELLED" } as Prisma.InputJsonValue,
    },
  });

  return updated;
};

export const deleteContract = async (id: string, userId: string) => {
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Contract not found");

  if (existing.status !== "CANCELLED") {
    throw new AppError(
      409,
      "Only CANCELLED contracts can be permanently deleted. Cancel it first."
    );
  }

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Contract",
      entityId: id,
      action: "DELETE",
      oldValue: { status: existing.status, type: existing.type } as Prisma.InputJsonValue,
    },
  });

  await prisma.contract.delete({ where: { id } });
};

/** Returns RTO balance for a tenant: deposit + (monthlyOption × monthsPaid) */
export const getRTOBalance = async (contractId: string) => {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      rtoDetail: true,
      paymentRecords: {
        where: { paymentStatus: { in: ["PAID_ON_TIME", "PAID_LATE", "PARTIAL"] } },
        select: { billingMonth: true, billingYear: true },
      },
    },
  });

  if (!contract?.rtoDetail) throw new AppError(404, "RTO contract not found");

  const rto = contract.rtoDetail;
  const monthsPaid = contract.paymentRecords.length;
  const optionAccumulated =
    Number(rto.optionAgreementMonthly) * monthsPaid;
  const totalAccumulated = Number(rto.initialDeposit) + optionAccumulated;
  const totalSalePrice = Number(rto.totalSalePrice);
  const progressPercent =
    totalSalePrice > 0
      ? Math.min(100, (totalAccumulated / totalSalePrice) * 100)
      : 0;

  return {
    purchasePrice: Number(rto.purchasePrice),
    egsFee: Number(rto.egsFee),
    totalSalePrice,
    optionAgreementMonthly: Number(rto.optionAgreementMonthly),
    initialDeposit: Number(rto.initialDeposit),
    monthsPaid,
    optionAccumulated,
    totalAccumulated,
    progressPercent: Math.round(progressPercent * 100) / 100,
    remainingBalance: Math.max(0, totalSalePrice - totalAccumulated),
  };
};
