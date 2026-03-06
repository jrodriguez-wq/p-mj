import { Request, Response } from "express";
import * as service from "./dashboard.service";
import { ok } from "../../utils/response";
import { z } from "zod";

export const getKPIs = async (_req: Request, res: Response) => {
  const result = await service.getKPIs();
  ok(res, result);
};

export const getAlerts = async (_req: Request, res: Response) => {
  const result = await service.getAlerts();
  ok(res, result);
};

export const getIncomeByCity = async (req: Request, res: Response) => {
  const year = z.coerce.number().default(new Date().getFullYear()).parse(req.query.year);
  const result = await service.getIncomeByCity(year);
  ok(res, result);
};
