// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './subject.service';
import { success } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.createSubject(req.tenant!.schoolId, req.body), 'Subject created', 201); }
  catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getSubjects(req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getSubject(req.params.id, req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.updateSubject(req.params.id, req.tenant!.schoolId, req.body), 'Subject updated'); }
  catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteSubject(req.params.id, req.tenant!.schoolId);
    success(res, null, 'Subject deleted');
  } catch (err) { next(err); }
};
