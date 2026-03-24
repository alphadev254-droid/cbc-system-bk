import { Request, Response, NextFunction } from 'express';
import * as svc from './schoolMember.service';
import { success } from '../../utils/apiResponse';
import { Role } from '../../config/constants';

export const listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.getMembers(req.params.schoolId));
  } catch (err) { next(err); }
};

export const assignMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.assignMember(
      req.user!.schoolId,           // actor's school from JWT
      req.params.schoolId,          // requested school from URL
      req.user!.isGlobalAdmin,
      req.body.userId,
      req.body.role as Role,
      req.user!.userId,
      req
    );
    success(res, result, 'Member assigned', 201);
  } catch (err) { next(err); }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.updateMemberRole(
      req.user!.schoolId,
      req.params.schoolId,
      req.user!.isGlobalAdmin,
      req.params.userId,
      req.body.role as Role,
      req.user!.userId,
      req
    );
    success(res, result, 'Role updated');
  } catch (err) { next(err); }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.removeMember(
      req.user!.schoolId,
      req.params.schoolId,
      req.user!.isGlobalAdmin,
      req.params.userId,
      req.user!.userId,
      req
    );
    success(res, null, 'Member removed');
  } catch (err) { next(err); }
};
