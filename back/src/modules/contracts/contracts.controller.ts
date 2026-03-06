import { Request, Response } from "express";
import * as service from "./contracts.service";
import {
  contractFiltersSchema,
  createContractSchema,
  renewContractSchema,
} from "./contracts.schemas";
import { ok, created, AppError } from "../../utils/response";

export const getAll = async (req: Request, res: Response) => {
  const filters = contractFiltersSchema.parse(req.query);
  const result = await service.findAll(filters);
  ok(res, result);
};

export const getOne = async (req: Request, res: Response) => {
  const result = await service.findById(String(req.params.id));
  ok(res, result);
};

export const create = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createContractSchema.parse(req.body);
  const result = await service.create(body, req.user.profileId);
  created(res, result);
};

export const renew = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = renewContractSchema.parse(req.body);
  const result = await service.renew(String(req.params.id), body, req.user.profileId);
  created(res, result);
};

export const cancel = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const result = await service.cancel(String(req.params.id), req.user.profileId);
  ok(res, result);
};

export const deleteContract = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  await service.deleteContract(String(req.params.id), req.user.profileId);
  ok(res, { deleted: true });
};

export const getRTOBalance = async (req: Request, res: Response) => {
  const result = await service.getRTOBalance(String(req.params.id));
  ok(res, result);
};
