import { Request, Response } from "express";
import * as service from "./tenants.service";
import {
  createTenantSchema,
  updateTenantSchema,
  tenantFiltersSchema,
  createNoteSchema,
} from "./tenants.schemas";
import { ok, created, noContent, AppError, forbidden } from "../../utils/response";

export const getAll = async (req: Request, res: Response) => {
  const filters = tenantFiltersSchema.parse(req.query);
  const result = await service.findAll(filters);
  ok(res, result);
};

export const getOne = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const id = String(req.params.id);

  // TENANT role can only see their own data
  if (req.user.role === "TENANT") {
    const tenant = await service.findById(id);
    if (tenant.id !== req.user.tenantId) {
      forbidden("You can only access your own data");
    }
    // Strip internal notes for tenant
    const { notes: _, ...tenantWithoutNotes } = tenant;
    ok(res, { ...tenantWithoutNotes, notes: undefined });
    return;
  }

  const result = await service.findById(id);
  ok(res, result);
};

export const create = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createTenantSchema.parse(req.body);
  const result = await service.create(body, req.user.profileId);
  created(res, result);
};

export const update = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = updateTenantSchema.parse(req.body);
  const result = await service.update(String(req.params.id), body, req.user.profileId);
  ok(res, result);
};

export const archive = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  await service.archive(String(req.params.id), req.user.profileId);
  noContent(res);
};

export const getNotes = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  if (req.user.role === "TENANT") forbidden("Access denied");
  const result = await service.getNotes(String(req.params.id));
  ok(res, result);
};

export const addNote = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const body = createNoteSchema.parse(req.body);
  const result = await service.addNote(String(req.params.id), body, {
    id: req.user.profileId,
    name: req.user.name,
  });
  created(res, result);
};
