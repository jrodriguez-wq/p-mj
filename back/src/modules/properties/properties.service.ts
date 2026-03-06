import { Prisma } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/response";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
} from "./properties.schemas";

export const findAll = async (filters: PropertyFilters) => {
  const { city, houseModel, status, contractType, search, page, limit } = filters;

  const where: Prisma.PropertyWhereInput = {
    isActive: true,
    ...(city && { city: { equals: city, mode: "insensitive" } }),
    ...(houseModel && { houseModel: { equals: houseModel, mode: "insensitive" } }),
    ...(status && { status }),
    ...(contractType && { contractType }),
    ...(search && {
      address: { contains: search, mode: "insensitive" },
    }),
  };

  const [total, properties] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { address: "asc" },
      include: {
        tenants: {
          where: { isActive: true },
          select: { id: true, displayName: true, rentAmount: true },
        },
        _count: { select: { contracts: true, paymentRecords: true } },
      },
    }),
  ]);

  return {
    data: properties,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const findById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      tenants: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          moveInDate: true,
          rentAmount: true,
          isActive: true,
        },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        include: { rtoDetail: true },
      },
      paymentRecords: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 12,
      },
    },
  });

  if (!property) throw new AppError(404, `Property not found`);
  return property;
};

export const create = async (data: CreatePropertyInput, userId: string) => {
  const property = await prisma.property.create({ data });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Property",
      entityId: property.id,
      action: "CREATE",
      newValue: property as unknown as Prisma.InputJsonValue,
    },
  });

  return property;
};

export const update = async (
  id: string,
  data: UpdatePropertyInput,
  userId: string
) => {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, `Property not found`);

  const updated = await prisma.property.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Property",
      entityId: id,
      action: "UPDATE",
      oldValue: existing as unknown as Prisma.InputJsonValue,
      newValue: updated as unknown as Prisma.InputJsonValue,
    },
  });

  return updated;
};

export const changeStatus = async (
  id: string,
  status: string,
  userId: string
) => {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, `Property not found`);

  const updated = await prisma.property.update({
    where: { id },
    data: { status: status as any },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Property",
      entityId: id,
      action: "STATUS_CHANGE",
      oldValue: { status: existing.status } as Prisma.InputJsonValue,
      newValue: { status: updated.status } as Prisma.InputJsonValue,
    },
  });

  return updated;
};

export const archive = async (id: string, userId: string) => {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, `Property not found`);

  // Check for active tenants
  const activeTenants = await prisma.tenant.count({
    where: { propertyId: id, isActive: true },
  });

  if (activeTenants > 0) {
    throw new AppError(
      409,
      "Cannot archive a property with active tenants. Archive tenants first."
    );
  }

  const archived = await prisma.property.update({
    where: { id },
    data: { isActive: false, status: "ARCHIVED" },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entityType: "Property",
      entityId: id,
      action: "DELETE",
      oldValue: existing as unknown as Prisma.InputJsonValue,
    },
  });

  return archived;
};
