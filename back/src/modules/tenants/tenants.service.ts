import { Prisma } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../lib/supabase";
import { AppError } from "../../utils/response";
import { calcContractEndDate } from "../../utils/dates";
import type {
  CreateTenantInput,
  UpdateTenantInput,
  TenantFilters,
  CreateNoteInput,
} from "./tenants.schemas";

export const findAll = async (filters: TenantFilters) => {
  const { city, houseModel, contractType, search, page, limit } = filters;

  const where: Prisma.TenantWhereInput = {
    isActive: true,
    ...(city && { property: { city: { equals: city, mode: "insensitive" } } }),
    ...(houseModel && {
      property: { houseModel: { equals: houseModel, mode: "insensitive" } },
    }),
    ...(contractType && {
      contracts: { some: { type: contractType, status: "ACTIVE" } },
    }),
    ...(search && {
      OR: [
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { property: { address: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [total, tenants] = await prisma.$transaction([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { displayName: "asc" },
      include: {
        property: { select: { id: true, address: true, city: true, houseModel: true } },
        contracts: {
          where: { status: "ACTIVE" },
          take: 1,
          include: { rtoDetail: true },
        },
      },
    }),
  ]);

  return { data: tenants, total, page, totalPages: Math.ceil(total / limit) };
};

export const findById = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      property: true,
      contracts: {
        orderBy: { startDate: "desc" },
        include: { rtoDetail: true, renewals: { select: { id: true, status: true } } },
      },
      paymentRecords: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 24,
        include: { transactions: true },
      },
      tenantNotes: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!tenant) throw new AppError(404, "Tenant not found");

  // Remove internal notes if the profile making the request is the tenant
  // (this check happens in the controller layer)
  return tenant;
};

export const create = async (data: CreateTenantInput, creatorId: string) => {
  // 1. Check property exists
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId, isActive: true },
  });
  if (!property) throw new AppError(404, "Property not found or inactive");

  // 2. Check for existing active tenant in that property
  const activeTenant = await prisma.tenant.findFirst({
    where: { propertyId: data.propertyId, isActive: true },
  });
  if (activeTenant) {
    throw new AppError(
      409,
      "Property already has an active tenant. Archive the current tenant first."
    );
  }

  // 3. Create Supabase Auth user for tenant
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    email_confirm: false, // tenant activates via magic link
    user_metadata: { role: "TENANT", displayName: data.displayName },
  });

  if (authError || !authData.user) {
    throw new AppError(500, `Failed to create auth account: ${authError?.message}`);
  }

  const supabaseUid = authData.user.id;

  // 4. Calculate contract end date
  const startDate = new Date(data.contract.startDate);
  const endDate = calcContractEndDate(startDate, data.contract.durationYears);

  // 5. Create tenant + contract + rtoDetail + userProfile in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        supabaseUid,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        propertyId: data.propertyId,
        moveInDate: new Date(data.moveInDate),
        rentAmount: data.rentAmount,
        preferredPayment: data.preferredPayment,
        notes: data.notes,
      },
    });

    // Create contract
    const contract = await tx.contract.create({
      data: {
        tenantId: tenant.id,
        propertyId: data.propertyId,
        type: data.contract.type,
        startDate,
        durationYears: data.contract.durationYears,
        endDate,
        status: "ACTIVE",
        renewalNumber: 0,
      },
    });

    // Create RTODetail if applicable
    if (data.contract.type === "RTO" && data.contract.rtoDetails) {
      const rto = data.contract.rtoDetails;
      await tx.rTODetail.create({
        data: {
          contractId: contract.id,
          purchasePrice: rto.purchasePrice,
          egsFee: rto.egsFee ?? 0,
          totalSalePrice: rto.purchasePrice + (rto.egsFee ?? 0),
          optionAgreementMonthly: rto.optionAgreementMonthly ?? 300,
          initialDeposit: rto.initialDeposit ?? 0,
        },
      });
    }

    // Create UserProfile for tenant portal access
    await tx.userProfile.create({
      data: {
        supabaseUid,
        name: data.displayName,
        email: data.email,
        role: "TENANT",
        tenantId: tenant.id,
      },
    });

    // Update property status
    await tx.property.update({
      where: { id: data.propertyId },
      data: { status: data.contract.type === "RTO" ? "RTO" : "OCCUPIED" },
    });

    return tenant;
  });

  // 6. Send welcome email with activation link
  await supabaseAdmin.auth.admin
    .generateLink({
      type: "magiclink",
      email: data.email,
    })
    .catch((err) => console.error("Failed to send welcome email:", err));

  // 7. Audit log
  await prisma.auditLog.create({
    data: {
      userId: creatorId,
      entityType: "Tenant",
      entityId: result.id,
      action: "CREATE",
      newValue: { displayName: result.displayName, email: result.email } as Prisma.InputJsonValue,
    },
  });

  return result;
};

export const update = async (
  id: string,
  data: UpdateTenantInput,
  userId: string
) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Tenant not found");

  const updated = await prisma.tenant.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Tenant",
      entityId: id,
      action: "UPDATE",
      oldValue: existing as unknown as Prisma.InputJsonValue,
      newValue: updated as unknown as Prisma.InputJsonValue,
    },
  });

  return updated;
};

export const archive = async (id: string, userId: string) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Tenant not found");

  await prisma.tenant.update({ where: { id }, data: { isActive: false } });

  // Update property to EMPTY if this was the active tenant
  await prisma.property.update({
    where: { id: existing.propertyId },
    data: { status: "EMPTY" },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Tenant",
      entityId: id,
      action: "DELETE",
      oldValue: existing as unknown as Prisma.InputJsonValue,
    },
  });
};

export const getNotes = async (tenantId: string) => {
  return prisma.tenantNote.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, role: true } },
    },
  });
};

export const addNote = async (
  tenantId: string,
  data: CreateNoteInput,
  author: { id: string; name: string }
) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError(404, "Tenant not found");

  return prisma.tenantNote.create({
    data: {
      tenantId,
      content: data.content,
      authorId: author.id,
      authorName: author.name,
    },
  });
};
