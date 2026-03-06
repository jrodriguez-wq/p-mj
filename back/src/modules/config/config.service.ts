import { prisma } from "../../lib/prisma";

export const getLateFeeConfig = async () => {
  const config = await prisma.lateFeeConfig.findFirst({ where: { isActive: true } });
  if (!config) {
    // Return default values when no config exists
    return {
      id: null,
      gracePeriodDays: 3,
      flatFeeDay4: 42,
      dailyFeeAfter: 11.35,
      isActive: true,
    };
  }
  return {
    id: config.id,
    gracePeriodDays: config.gracePeriodDays,
    flatFeeDay4: Number(config.flatFeeDay4),
    dailyFeeAfter: Number(config.dailyFeeAfter),
    isActive: config.isActive,
  };
};

export const upsertLateFeeConfig = async (data: {
  gracePeriodDays: number;
  flatFeeDay4: number;
  dailyFeeAfter: number;
}) => {
  const existing = await prisma.lateFeeConfig.findFirst({ where: { isActive: true } });

  if (existing) {
    const updated = await prisma.lateFeeConfig.update({
      where: { id: existing.id },
      data: {
        gracePeriodDays: data.gracePeriodDays,
        flatFeeDay4: data.flatFeeDay4,
        dailyFeeAfter: data.dailyFeeAfter,
      },
    });
    return {
      id: updated.id,
      gracePeriodDays: updated.gracePeriodDays,
      flatFeeDay4: Number(updated.flatFeeDay4),
      dailyFeeAfter: Number(updated.dailyFeeAfter),
      isActive: updated.isActive,
    };
  }

  const created = await prisma.lateFeeConfig.create({
    data: {
      name: "Default",
      gracePeriodDays: data.gracePeriodDays,
      flatFeeDay4: data.flatFeeDay4,
      dailyFeeAfter: data.dailyFeeAfter,
      isActive: true,
    },
  });
  return {
    id: created.id,
    gracePeriodDays: created.gracePeriodDays,
    flatFeeDay4: Number(created.flatFeeDay4),
    dailyFeeAfter: Number(created.dailyFeeAfter),
    isActive: created.isActive,
  };
};
