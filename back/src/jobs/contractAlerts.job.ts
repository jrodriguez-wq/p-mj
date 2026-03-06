import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { daysUntil } from "../utils/dates";

/**
 * Runs every night at 01:00 AM.
 * Checks all ACTIVE contracts and creates alerts for those expiring within 90 days.
 * Marks contractAlerts as sent to avoid duplicate emails.
 */
export const startContractAlertsJob = () => {
  cron.schedule("0 1 * * *", async () => {
    console.log("[CronJob] Running contract alerts check...");

    const activeContracts = await prisma.contract.findMany({
      where: { status: "ACTIVE" },
      include: {
        tenant: { select: { displayName: true, email: true } },
        property: { select: { address: true, city: true } },
      },
    });

    const now = new Date();
    let alertsCreated = 0;

    for (const contract of activeContracts) {
      const days = daysUntil(contract.endDate);

      // Mark expired contracts
      if (days < 0) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { status: "EXPIRED" },
        });

        await prisma.alertNotification.create({
          data: {
            type: "CONTRACT_EXPIRED",
            entityType: "Contract",
            entityId: contract.id,
            severity: "RED",
            message: `Contract for ${contract.tenant.displayName} at ${contract.property.address} expired ${Math.abs(days)} days ago`,
          },
        });

        alertsCreated++;
        continue;
      }

      // Create alerts for contracts expiring within 90 days
      // Only send if alert hasn't been sent yet (alertSentAt is null)
      const shouldAlert = days <= 90 && !contract.alertSentAt;

      if (shouldAlert) {
        const severity = days <= 30 ? "RED" : "YELLOW";

        await prisma.alertNotification.create({
          data: {
            type: "CONTRACT_EXPIRING",
            entityType: "Contract",
            entityId: contract.id,
            severity,
            message: `Contract for ${contract.tenant.displayName} at ${contract.property.address} expires in ${days} days (${contract.endDate.toLocaleDateString()})`,
          },
        });

        await prisma.contract.update({
          where: { id: contract.id },
          data: { alertSentAt: now },
        });

        alertsCreated++;
      }
    }

    console.log(`[CronJob] Contract alerts: ${alertsCreated} alerts created`);
  });

  console.log("[CronJob] Contract alerts job scheduled (daily at 01:00 AM)");
};
