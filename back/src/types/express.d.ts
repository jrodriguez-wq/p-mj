import { UserRole } from "../../generated/prisma/index.js";

// Extend Express Request with the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        profileId: string;    // UserProfile.id
        supabaseUid: string;  // Supabase Auth UID
        email: string;
        name: string;
        role: UserRole;
        tenantId: string | null;
      };
    }
  }
}
