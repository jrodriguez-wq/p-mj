import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly, ownerAdminCobradorOnly } from "../../middleware/requireRoles";
import * as ctrl from "./tenants.controller";

const router = Router();

router.use(requireAuth);

router.get("/", ownerAdminCobradorOnly, ctrl.getAll);
router.get("/:id", ctrl.getOne);           // tenants see only their own (guarded in controller)
router.post("/", ownerAdminOnly, ctrl.create);
router.put("/:id", ownerAdminOnly, ctrl.update);
router.delete("/:id", ownerAdminOnly, ctrl.archive);

// Notes (internal)
router.get("/:id/notes", ownerAdminCobradorOnly, ctrl.getNotes);
router.post("/:id/notes", ownerAdminOnly, ctrl.addNote);

export default router;
