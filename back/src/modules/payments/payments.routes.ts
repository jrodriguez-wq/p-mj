import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly, ownerAdminCobradorOnly } from "../../middleware/requireRoles";
import * as ctrl from "./payments.controller";

const router = Router();

router.use(requireAuth);

// Monthly table view (admin/cobrador)
router.get("/monthly", ownerAdminCobradorOnly, ctrl.getMonthlyTable);

// All active tenants billing overview for a given month (includes tenants without a record yet)
router.get("/tenants-billing", ownerAdminCobradorOnly, ctrl.getTenantsBilling);

// "Collect today" view for cobradors (mobile-first)
router.get("/collect-today", ownerAdminCobradorOnly, ctrl.getCollectToday);

// Real-time late fee calculator (any authenticated user)
router.get("/late-fee-calculator", ctrl.lateFeeCalculator);

// Tenant payment history
router.get("/tenant/:tenantId", ctrl.getByTenant);

// Individual record
router.get("/:id", ctrl.getOne);

// Create payment record for a month
router.post("/", ownerAdminCobradorOnly, ctrl.createRecord);

// Add a transaction (partial/additional payment)
router.post("/:id/transactions", ownerAdminCobradorOnly, ctrl.addTransaction);

// Delete a transaction (recalculates record totals)
router.delete("/:id/transactions/:txId", ownerAdminCobradorOnly, ctrl.deleteTransaction);

export default router;
