import { Response } from "express";

export const ok = <T>(res: Response, data: T, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const created = <T>(res: Response, data: T) => {
  ok(res, data, 201);
};

export const noContent = (res: Response) => {
  res.status(204).send();
};

// Custom application error — caught by the global error handler
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (entity: string, id?: string) => {
  const msg = id ? `${entity} with id "${id}" not found` : `${entity} not found`;
  throw new AppError(404, msg);
};

export const forbidden = (msg = "Access denied") => {
  throw new AppError(403, msg);
};

export const badRequest = (msg: string) => {
  throw new AppError(400, msg);
};
