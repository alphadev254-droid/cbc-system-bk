// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './teacherSubject.service';
import { success } from '../../utils/apiResponse';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.listTeacherSubjects(req.tenant!.schoolId));
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, subjectId, gradeLevels } = req.body as { userId: string; subjectId: string; gradeLevels: string[] };
    success(
      res,
      await svc.createTeacherSubject(req.tenant!.schoolId, userId, subjectId, gradeLevels),
      'Teacher assigned to subject',
      201
    );
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deleteTeacherSubject(req.params.id, req.tenant!.schoolId);
    success(res, null, 'Subject assignment removed');
  } catch (err) { next(err); }
};
