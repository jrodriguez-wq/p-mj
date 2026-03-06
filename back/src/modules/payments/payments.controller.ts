import { Request, Response } from "express";
import * as service from "./payments.service";
import {
  createPaymentRecordSchema,
  addTransactionSchema,
  monthlyTableSchema,
  lateFeeCalculatorSchema,
} from "./payments.schemas";
import { ok, created, AppError } from "../../utils/response";

export const getMonthlyTable = async (req: Request, res: Response) => {
  const query = monthlyTableSchema.parse(req.query);
  const result = await service.getMonthlyTable(query);
  ok(res, result);
};

export const getTenantsBilling = async (req: Request, res: Response) => {
  const query = monthlyTableSchema.parse(req.query);
  const result = await service.getTenantsBilling(query.month, query.year, query.city, query.search);
  ok(res, result);
};

export const getCollectToday = async (req: Request, res: Response) => {
  const result = await service.getCollectToday();
  ok(res, result);
};

export const getByTenant = async (req: Request, res: Response) => {
  const result = await service.getByTenant(String(req.params.tenantId));
  ok(res, result);
};

export const getOne = async (req: Request, res: Response) => {
  const result = await service.getById(String(req.params.id));
  ok(res, result);
};

export const createRecord = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createPaymentRecordSchema.parse(req.body);
  const result = await service.createRecord(body, req.user.profileId);
  created(res, result);
};

export const addTransaction = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = addTransactionSchema.parse(req.body);
  const result = await service.addTransaction(
    String(req.params.id),
    body,
    req.user.profileId
  );
  created(res, result);
};

export const deleteTransaction = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  await service.deleteTransaction(
    String(req.params.id),
    String(req.params.txId),
    req.user.profileId
  );
  ok(res, { deleted: true });
};

export const lateFeeCalculator = async (req: Request, res: Response) => {
  const { baseRent, day } = lateFeeCalculatorSchema.parse(req.query);
  const result = await service.calculateForDay(baseRent, day);
  ok(res, result);
};
