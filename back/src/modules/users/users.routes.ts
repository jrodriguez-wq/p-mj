import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { ownerAdminOnly } from "../../middleware/requireRoles";
import * as ctrl from "./users.controller";

const router = Router();

router.use(requireAuth, ownerAdminOnly);

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.deactivate);

export default router;
