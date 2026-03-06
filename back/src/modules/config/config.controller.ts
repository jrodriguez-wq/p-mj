import { Request, Response } from "express";
import * as service from "./config.service";
import { updateLateFeeConfigSchema } from "./config.schemas";
import { ok } from "../../utils/response";

export const getConfig = async (_req: Request, res: Response) => {
  const config = await service.getLateFeeConfig();
  ok(res, config);
};

export const updateConfig = async (req: Request, res: Response) => {
  const body = updateLateFeeConfigSchema.parse(req.body);
  const config = await service.upsertLateFeeConfig(body);
  ok(res, config);
};
