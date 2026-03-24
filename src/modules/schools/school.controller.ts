import { Request, Response, NextFunction } from 'express';
import * as schoolService from './school.service';
import { success } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const school = await schoolService.createSchool(req.body, req.user!.userId, req);
    success(res, school, 'School created', 201);
  } catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await schoolService.getSchools(Number(req.query.page) || 1, Number(req.query.limit) || 10);
    success(res, data);
  } catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await schoolService.getSchool(req.params.id));
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const school = await schoolService.updateSchool(req.params.id, req.body, req.user!.userId, req);
    success(res, school, 'School updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await schoolService.deleteSchool(req.params.id, req.user!.userId, req);
    success(res, null, 'School deleted');
  } catch (err) { next(err); }
};
