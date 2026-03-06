import { Request, Response } from "express";
import { loginSchema } from "./auth.schemas";
import * as authService from "./auth.service";
import { ok, AppError } from "../../utils/response";

const COOKIE_NAME = "sb-access-token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

export const login = async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);

  // Set token as httpOnly cookie
  res.cookie(COOKIE_NAME, result.accessToken, COOKIE_OPTIONS);

  ok(res, result);
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) await authService.logout(token);
  res.clearCookie(COOKIE_NAME);
  ok(res, { message: "Logged out successfully" });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const profile = await authService.getMe(req.user.supabaseUid);
  ok(res, profile);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    throw new AppError(400, "Email is required");
  }
  const result = await authService.forgotPassword(email);
  ok(res, result);
};
