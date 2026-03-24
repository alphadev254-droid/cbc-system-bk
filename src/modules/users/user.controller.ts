import { Request, Response, NextFunction } from 'express';
import * as svc from './user.service';
import { success } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await svc.createUser(req.body, req.user!.userId, req);
    success(res, user, 'User created', 201);
  } catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // SYSTEM_ADMIN passes schoolId as query param, others use tenant
    const schoolId = req.user!.isGlobalAdmin
      ? (req.query.schoolId as string ?? req.tenant?.schoolId)
      : req.tenant!.schoolId;
    const data = await svc.getUsers(schoolId!, Number(req.query.page) || 1, Number(req.query.limit) || 10);
    success(res, data);
  } catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.getUser(req.params.id, req.tenant!.schoolId));
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await svc.updateUser(req.params.id, req.tenant!.schoolId, req.body, req.user!.userId, req);
    success(res, user, 'User updated');
  } catch (err) { next(err); }
};

export const deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deactivateUser(req.params.id, req.tenant!.schoolId, req.user!.userId, req);
    success(res, null, 'User deactivated');
  } catch (err) { next(err); }
};
