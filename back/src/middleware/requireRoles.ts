import { Request, Response, NextFunction } from "express";
import { UserRole } from "../../generated/prisma/index.js";

/**
 * Role-based access control middleware.
 * Usage: requireRoles("OWNER", "ADMIN")
 */
export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

// Convenience shorthands
export const ownerAdminOnly = requireRoles("OWNER", "ADMIN");
export const ownerAdminCobradorOnly = requireRoles("OWNER", "ADMIN", "COBRADOR");
export const ownerOnly = requireRoles("OWNER");
