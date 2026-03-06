import { env } from "./config/env";
import app from "./app";
import { startContractAlertsJob } from "./jobs/contractAlerts.job";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════╗");
  console.log("  ║         NeWell RMS — Backend API         ║");
  console.log("  ╚══════════════════════════════════════════╝");
  console.log(`  🚀  Running on http://localhost:${PORT}`);
  console.log(`  📦  Environment: ${env.NODE_ENV}`);
  console.log("");
  console.log("  Routes:");
  console.log(`  GET  /health`);
  console.log(`  POST /api/auth/login          — Login`);
  console.log(`  GET  /api/auth/me             — Current user`);
  console.log(`  GET  /api/properties          — List properties`);
  console.log(`  GET  /api/tenants             — List tenants`);
  console.log(`  GET  /api/contracts           — List contracts`);
  console.log(`  GET  /api/payments/monthly    — Monthly table`);
  console.log(`  GET  /api/payments/collect-today — Collect today`);
  console.log(`  GET  /api/dashboard/kpis      — Dashboard KPIs`);
  console.log(`  GET  /api/dashboard/alerts    — Alert panel`);
  console.log(`  GET  /api/users               — System users`);
  console.log("");

  // Start background jobs
  startContractAlertsJob();
});
