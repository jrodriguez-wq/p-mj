import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly } from "../../middleware/requireRoles";
import * as ctrl from "./config.controller";

const router = Router();

router.use(requireAuth);

// GET /api/config/late-fees — any authenticated user can read
router.get("/late-fees", ctrl.getConfig);

// PUT /api/config/late-fees — owner/admin only can update
router.put("/late-fees", ownerAdminOnly, ctrl.updateConfig);

export default router;
