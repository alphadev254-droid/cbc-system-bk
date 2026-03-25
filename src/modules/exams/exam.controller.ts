import { Request, Response, NextFunction } from 'express';
import * as svc from './exam.service';
import { success } from '../../utils/apiResponse';
import { CurriculumType } from '../../config/constants';

export const createExamType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.createExamType(req.tenant!.schoolId, req.body), 'Exam type created', 201); }
  catch (err) { next(err); }
};

export const getExamTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getExamTypes(req.tenant!.schoolId, req.query.termId as string)); }
  catch (err) { next(err); }
};

export const enterMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.enterMarks(req.body, req.tenant!.schoolId), 'Marks entered', 201); }
  catch (err) { next(err); }
};

export const bulkEnterMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.bulkEnterMarks(req.body.marks, req.tenant!.schoolId), 'Marks entered', 201); }
  catch (err) { next(err); }
};

export const approveMark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.approveMark(req.params.id, req.user!.userId), 'Mark approved'); }
  catch (err) { next(err); }
};

export const getStudentMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const curriculum = (req.query.curriculum as CurriculumType) || CurriculumType.CBC;
    success(res, await svc.getStudentMarks(req.params.studentId, req.query.termId as string, curriculum, req.tenant!.schoolId));
  } catch (err) { next(err); }
};
