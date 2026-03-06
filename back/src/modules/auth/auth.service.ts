import { supabaseAnon, supabaseAdmin } from "../../lib/supabase";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/response";
import type { LoginInput } from "./auth.schemas";

export const login = async ({ email, password }: LoginInput) => {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    throw new AppError(401, error?.message ?? "Invalid credentials");
  }

  // Load profile to get role
  const profile = await prisma.userProfile.findUnique({
    where: { supabaseUid: data.user.id },
    select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true },
  });

  if (!profile) {
    throw new AppError(401, "User profile not found. Contact an administrator.");
  }

  if (!profile.isActive) {
    throw new AppError(403, "Account is disabled. Contact an administrator.");
  }

  // Update last login
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      tenantId: profile.tenantId ?? null,
    },
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
};

export const logout = async (_accessToken: string) => {
  // Supabase token invalidation is handled client-side.
  // The server simply clears the cookie in the controller.
};

export const getMe = async (supabaseUid: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { supabaseUid },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!profile) throw new AppError(404, "User profile not found");
  return profile;
};

export const forgotPassword = async (email: string) => {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONT_ORIGIN}/reset-password`,
  });

  if (error) throw new AppError(400, error.message);
  return { message: "Password reset email sent" };
};
