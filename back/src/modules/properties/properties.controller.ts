import { Request, Response } from "express";
import * as service from "./properties.service";
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
  changeStatusSchema,
} from "./properties.schemas";
import { ok, created, noContent, AppError } from "../../utils/response";

export const getAll = async (req: Request, res: Response) => {
  const filters = propertyFiltersSchema.parse(req.query);
  const result = await service.findAll(filters);
  ok(res, result);
};

export const getOne = async (req: Request, res: Response) => {
  const result = await service.findById(String(req.params.id));
  ok(res, result);
};

export const create = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createPropertySchema.parse(req.body);
  const result = await service.create(body, req.user.profileId);
  created(res, result);
};

export const update = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updatePropertySchema.parse(req.body);
  const result = await service.update(String(req.params.id), body, req.user.profileId);
  ok(res, result);
};

export const changeStatus = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const { status } = changeStatusSchema.parse(req.body);
  const result = await service.changeStatus(String(req.params.id), status, req.user.profileId);
  ok(res, result);
};

export const archive = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  await service.archive(String(req.params.id), req.user.profileId);
  noContent(res);
};
