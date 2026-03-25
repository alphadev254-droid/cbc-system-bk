import { Request, Response, NextFunction } from 'express';
import * as svc from './academicYear.service';
import { success } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.createYear(req.tenant!.schoolId, req.body.year), 'Year created', 201); }
  catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getYears(req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.activateYear(req.params.id, req.tenant!.schoolId);
    success(res, null, 'Academic year activated');
  } catch (err) { next(err); }
};

export const addTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYearId, termNumber, startDate, endDate } = req.body;
    const term = await svc.createTerm(req.tenant!.schoolId, academicYearId, termNumber, new Date(startDate), new Date(endDate));
    success(res, term, 'Term created', 201);
  } catch (err) { next(err); }
};

export const activateTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.setActiveTerm(req.params.termId, req.tenant!.schoolId);
    success(res, null, 'Term activated');
  } catch (err) { next(err); }
};

export const updateYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.updateYear(req.params.id, req.tenant!.schoolId, req.body.year), 'Year updated');
  } catch (err) { next(err); }
};

export const updateTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.body;
    success(res, await svc.updateTerm(req.params.termId, req.tenant!.schoolId, {
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    }), 'Term updated');
  } catch (err) { next(err); }
};

export const removeYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteYear(req.params.id, req.tenant!.schoolId);
    success(res, null, 'Academic year deleted');
  } catch (err) { next(err); }
};

export const removeTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteTerm(req.params.termId, req.tenant!.schoolId);
    success(res, null, 'Term deleted');
  } catch (err) { next(err); }
};
