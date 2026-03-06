import { Request, Response, NextFunction } from "express";
import { supabaseAnon } from "../lib/supabase";
import { prisma } from "../lib/prisma";

const COOKIE_NAME = "sb-access-token";

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[COOKIE_NAME] ?? null;
};

/**
 * Verifies the JWT, loads the UserProfile from the DB,
 * and attaches the user to req.user.
 * Returns 401 if token is missing/invalid or profile is inactive.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  // 1. Verify token with Supabase
  const { data: { user: supabaseUser }, error } = await supabaseAnon.auth.getUser(token);

  if (error || !supabaseUser) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
    return;
  }

  // 2. Load UserProfile from DB to get role and system data
  const profile = await prisma.userProfile.findUnique({
    where: { supabaseUid: supabaseUser.id },
  });

  if (!profile) {
    res.status(401).json({ success: false, error: "User profile not found" });
    return;
  }

  if (!profile.isActive) {
    res.status(403).json({ success: false, error: "Account is disabled" });
    return;
  }

  // 3. Attach to request
  req.user = {
    profileId: profile.id,
    supabaseUid: profile.supabaseUid,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    tenantId: profile.tenantId ?? null,
  };

  // Update last login (fire-and-forget)
  prisma.userProfile
    .update({ where: { id: profile.id }, data: { lastLoginAt: new Date() } })
    .catch(() => {}); // non-critical

  next();
};
