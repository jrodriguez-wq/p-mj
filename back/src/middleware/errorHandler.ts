import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/response";

/**
 * Global error handler — must be the last middleware registered.
 * Handles: AppError (known), ZodError (validation), and generic errors.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Known application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation error",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  ) {
    res.status(409).json({ success: false, error: "Record already exists (duplicate)" });
    return;
  }

  // Unknown error — log it, send generic response
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
};
