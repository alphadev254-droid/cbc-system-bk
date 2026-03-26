// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './schoolClass.service';
import { success } from '../../utils/apiResponse';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.listSchoolClasses(req.tenant!.schoolId));
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.createSchoolClass(req.tenant!.schoolId, req.body), 'Class created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.updateSchoolClass(req.params.id, req.tenant!.schoolId, req.body), 'Class updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteSchoolClass(req.params.id, req.tenant!.schoolId);
    success(res, null, 'Class deleted');
  } catch (err) { next(err); }
};
