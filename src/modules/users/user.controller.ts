import { Request, Response, NextFunction } from 'express';
import type { Role as PrismaRole } from '@prisma/client';
import * as svc from './user.service';
import { success, error } from '../../utils/apiResponse';
import { Role } from '../../config/constants';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = req.user!.isGlobalAdmin ? (req.body.schoolId as string) : req.tenant!.schoolId;
    if (!schoolId) {
      error(res, 'schoolId is required', 400);
      return;
    }
    const user = await svc.createUser({ ...req.body, schoolId }, req.user!.userId, req);
    success(res, user, 'User created', 201);
  } catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = req.user!.isGlobalAdmin
      ? (req.query.schoolId as string ?? req.tenant?.schoolId)
      : req.tenant!.schoolId;
    if (!schoolId) {
      error(res, 'schoolId is required', 400);
      return;
    }
    const roleParam = req.query.role as string | undefined;
    if (roleParam && !Object.values(Role).includes(roleParam as Role)) {
      error(res, 'Invalid role filter', 400);
      return;
    }
    const data = await svc.getUsers(
      schoolId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
      roleParam as PrismaRole | undefined
    );
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

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteUser(req.params.id, req.tenant!.schoolId, req.user!.userId, req);
    success(res, null, 'User deleted');
  } catch (err) { next(err); }
};

export const deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deactivateUser(req.params.id, req.tenant!.schoolId, req.user!.userId, req);
    success(res, null, 'User deactivated');
  } catch (err) { next(err); }
};
