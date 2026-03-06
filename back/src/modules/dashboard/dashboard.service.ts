import { prisma } from "../../lib/prisma";
import { daysUntil } from "../../utils/dates";

export const getKPIs = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [
    totalProperties,
    emptyProperties,
    rtoProperties,
    soldThisYear,
    activeTenantsCount,
    currentMonthRecords,
    overdueCount,
    lateFeeTotal,
    last12Months,
  ] = await prisma.$transaction([
    // Total active properties
    prisma.property.count({ where: { isActive: true } }),

    // Empty properties
    prisma.property.count({ where: { isActive: true, status: "EMPTY" } }),

    // RTO properties
    prisma.property.count({ where: { isActive: true, status: "RTO" } }),

    // Sold this year
    prisma.property.count({
      where: {
        status: "SOLD",
        updatedAt: { gte: new Date(year, 0, 1) },
      },
    }),

    // Active tenants
    prisma.tenant.count({ where: { isActive: true } }),

    // Current month payment records
    prisma.paymentRecord.aggregate({
      where: { billingMonth: month, billingYear: year },
      _sum: { rentAmount: true, amountPaid: true, lateFeesAmount: true },
      _count: true,
    }),

    // Overdue (30+ days without any payment)
    prisma.paymentRecord.count({
      where: {
        billingMonth: month,
        billingYear: year,
        paymentStatus: "PENDING",
        tenant: { isActive: true },
      },
    }),

    // Total late fees this month
    prisma.paymentRecord.aggregate({
      where: {
        billingMonth: month,
        billingYear: year,
        lateFeesAmount: { gt: 0 },
      },
      _sum: { lateFeesAmount: true },
    }),

    // Last 12 months income
    prisma.paymentRecord.groupBy({
      by: ["billingYear", "billingMonth"],
      where: {
        billingYear: { gte: year - 1 },
        paymentStatus: { in: ["PAID_ON_TIME", "PAID_LATE", "PARTIAL"] },
      },
      _sum: { amountPaid: true },
      orderBy: [{ billingYear: "asc" }, { billingMonth: "asc" }],
    }),
  ]);

  const expectedThisMonth = Number(currentMonthRecords._sum.rentAmount ?? 0);
  const collectedThisMonth = Number(currentMonthRecords._sum.amountPaid ?? 0);
  const collectionRate =
    expectedThisMonth > 0
      ? Math.round((collectedThisMonth / expectedThisMonth) * 100)
      : 0;

  return {
    properties: {
      total: totalProperties,
      empty: emptyProperties,
      rto: rtoProperties,
      soldThisYear,
      occupied: totalProperties - emptyProperties - rtoProperties,
    },
    tenants: { active: activeTenantsCount },
    payments: {
      month,
      year,
      expected: expectedThisMonth,
      collected: collectedThisMonth,
      collectionRate,
      overdueCount,
      totalLateFees: Number(lateFeeTotal._sum.lateFeesAmount ?? 0),
    },
    last12Months: last12Months.map((r) => ({
      month: r.billingMonth,
      year: r.billingYear,
      collected: Number(r._sum?.amountPaid ?? 0),
    })),
  };
};

export const getAlerts = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // 1. Contracts expiring soon
  const activeContracts = await prisma.contract.findMany({
    where: { status: "ACTIVE" },
    include: {
      tenant: { select: { id: true, displayName: true } },
      property: { select: { id: true, address: true, city: true } },
    },
  });

  const contractAlerts = activeContracts
    .map((c) => ({
      type: "CONTRACT_EXPIRING" as const,
      contract: c,
      daysRemaining: daysUntil(c.endDate),
    }))
    .filter((a) => a.daysRemaining <= 90)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map((a) => ({
      severity: a.daysRemaining <= 0 ? "RED" : a.daysRemaining <= 30 ? "RED" : "YELLOW",
      type: a.daysRemaining <= 0 ? "CONTRACT_EXPIRED" : "CONTRACT_EXPIRING",
      message:
        a.daysRemaining <= 0
          ? `Contract expired ${Math.abs(a.daysRemaining)} days ago`
          : `Contract expires in ${a.daysRemaining} days`,
      entityType: "Contract",
      entityId: a.contract.id,
      tenant: a.contract.tenant,
      property: a.contract.property,
      endDate: a.contract.endDate,
    }));

  // 2. Overdue payments (current month, no payment at all)
  const overduePayments = await prisma.paymentRecord.findMany({
    where: {
      billingMonth: month,
      billingYear: year,
      paymentStatus: "PENDING",
      tenant: { isActive: true },
    },
    include: {
      tenant: { select: { id: true, displayName: true, phone: true } },
      property: { select: { id: true, address: true, city: true } },
    },
    orderBy: { rentAmount: "desc" },
  });

  const paymentAlerts = overduePayments.map((r) => ({
    severity: "RED" as const,
    type: "PAYMENT_OVERDUE" as const,
    message: `No payment recorded for ${month}/${year}`,
    entityType: "PaymentRecord",
    entityId: r.id,
    tenant: r.tenant,
    property: r.property,
    rentAmount: Number(r.rentAmount),
  }));

  // 3. Empty properties (30+ days)
  const emptyProperties = await prisma.property.findMany({
    where: {
      isActive: true,
      status: "EMPTY",
      updatedAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, address: true, city: true, updatedAt: true },
  });

  const vacantAlerts = emptyProperties.map((p) => ({
    severity: "GREEN" as const,
    type: "PROPERTY_VACANT" as const,
    message: `Property has been empty for ${Math.abs(daysUntil(p.updatedAt))} days`,
    entityType: "Property",
    entityId: p.id,
    property: p,
  }));

  return {
    contracts: contractAlerts,
    payments: paymentAlerts,
    vacant: vacantAlerts,
    totals: {
      red: [...contractAlerts, ...paymentAlerts].filter((a) => a.severity === "RED").length,
      yellow: contractAlerts.filter((a) => a.severity === "YELLOW").length,
      green: vacantAlerts.length,
    },
  };
};

export const getIncomeByCity = async (year: number) => {
  return prisma.paymentRecord.groupBy({
    by: ["billingMonth", "billingYear"],
    where: {
      billingYear: year,
      paymentStatus: { in: ["PAID_ON_TIME", "PAID_LATE", "PARTIAL"] },
    },
    _sum: { amountPaid: true },
    orderBy: { billingMonth: "asc" },
  });
};
