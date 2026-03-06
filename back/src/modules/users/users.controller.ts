import { Request, Response } from "express";
import * as service from "./users.service";
import { createUserSchema, updateUserSchema } from "./users.schemas";
import { ok, created, noContent, AppError } from "../../utils/response";

export const getAll = async (_req: Request, res: Response) => {
  const result = await service.findAll();
  ok(res, result);
};

export const getOne = async (req: Request, res: Response) => {
  const result = await service.findById(String(req.params.id));
  ok(res, result);
};

export const create = async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);
  const result = await service.create(body);
  created(res, result);
};

export const update = async (req: Request, res: Response) => {
  const body = updateUserSchema.parse(req.body);
  const result = await service.update(String(req.params.id), body);
  ok(res, result);
};

export const deactivate = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const id = String(req.params.id);
  if (id === req.user.profileId) {
    throw new AppError(400, "You cannot deactivate your own account");
  }
  await service.deactivate(id);
  noContent(res);
};
