import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly, ownerAdminCobradorOnly } from "../../middleware/requireRoles";
import * as ctrl from "./dashboard.controller";

const router = Router();

router.use(requireAuth);

router.get("/kpis", ownerAdminCobradorOnly, ctrl.getKPIs);
router.get("/alerts", ownerAdminOnly, ctrl.getAlerts);
router.get("/income-by-city", ownerAdminOnly, ctrl.getIncomeByCity);

export default router;
