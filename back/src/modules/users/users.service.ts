import { UserRole } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../lib/supabase";
import { AppError } from "../../utils/response";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas";

export const findAll = async () => {
  return prisma.userProfile.findMany({
    where: { role: { not: "TENANT" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
};

export const findById = async (id: string) => {
  const user = await prisma.userProfile.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError(404, "User not found");
  return user;
};

export const create = async (data: CreateUserInput) => {
  // Create Supabase Auth user
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.temporaryPassword,
    email_confirm: true,
    user_metadata: { role: data.role, name: data.name },
  });

  if (error || !authData.user) {
    throw new AppError(500, `Failed to create auth account: ${error?.message}`);
  }

  // Create UserProfile
  const profile = await prisma.userProfile.create({
    data: {
      supabaseUid: authData.user.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return profile;
};

export const update = async (id: string, data: UpdateUserInput) => {
  const existing = await prisma.userProfile.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "User not found");

  const updated = await prisma.userProfile.update({
    where: { id },
    data: { ...data, role: data.role as UserRole | undefined },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  // Sync with Supabase Auth if role or name changed
  if (data.role || !data.isActive) {
    await supabaseAdmin.auth.admin
      .updateUserById(existing.supabaseUid, {
        user_metadata: { role: updated.role, name: updated.name },
      })
      .catch((err) => console.error("Failed to sync Supabase profile:", err));
  }

  return updated;
};

export const deactivate = async (id: string) => {
  const existing = await prisma.userProfile.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "User not found");

  await prisma.userProfile.update({ where: { id }, data: { isActive: false } });

  // Ban in Supabase Auth
  await supabaseAdmin.auth.admin
    .updateUserById(existing.supabaseUid, { ban_duration: "876000h" })
    .catch((err) => console.error("Failed to ban user in Supabase:", err));
};
