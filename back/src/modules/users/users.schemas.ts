import { z } from "zod";

const StaffRole = z.enum(["OWNER", "ADMIN", "COBRADOR"]);
type StaffRole = z.infer<typeof StaffRole>;

export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  role: StaffRole,
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: StaffRole.optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
