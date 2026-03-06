import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly } from "../../middleware/requireRoles";
import * as ctrl from "./properties.controller";

const router = Router();

router.use(requireAuth); // all property routes require auth

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", ownerAdminOnly, ctrl.create);
router.put("/:id", ownerAdminOnly, ctrl.update);
router.patch("/:id/status", ownerAdminOnly, ctrl.changeStatus);
router.delete("/:id", ownerAdminOnly, ctrl.archive);

export default router;
