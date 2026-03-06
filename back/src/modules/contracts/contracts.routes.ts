import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly, ownerAdminCobradorOnly } from "../../middleware/requireRoles";
import * as ctrl from "./contracts.controller";

const router = Router();

router.use(requireAuth);

router.get("/", ownerAdminCobradorOnly, ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.get("/:id/rto-balance", ctrl.getRTOBalance);
router.post("/", ownerAdminOnly, ctrl.create);
router.post("/:id/renew", ownerAdminOnly, ctrl.renew);
router.patch("/:id/cancel", ownerAdminOnly, ctrl.cancel);
router.delete("/:id", ownerAdminOnly, ctrl.deleteContract);

export default router;
