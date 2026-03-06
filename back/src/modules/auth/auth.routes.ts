import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import * as ctrl from "./auth.controller";

const router = Router();

// Public routes
router.post("/login", ctrl.login);
router.post("/forgot-password", ctrl.forgotPassword);

// Protected routes
router.post("/logout", requireAuth, ctrl.logout);
router.get("/me", requireAuth, ctrl.getMe);

export default router;
