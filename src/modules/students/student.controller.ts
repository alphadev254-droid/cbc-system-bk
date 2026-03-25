import { Request, Response, NextFunction } from 'express';
import * as svc from './student.service';
import { success } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.createStudent(req.tenant!.schoolId, req.body), 'Student created', 201); }
  catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getStudents(req.tenant!.schoolId, Number(req.query.page) || 1, Number(req.query.limit) || 10)); }
  catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getStudent(req.params.id, req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.updateStudent(req.params.id, req.tenant!.schoolId, req.body), 'Student updated'); }
  catch (err) { next(err); }
};

export const deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.deactivateStudent(req.params.id, req.tenant!.schoolId), 'Student deactivated'); }
  catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { await svc.deleteStudent(req.params.id, req.tenant!.schoolId); success(res, null, 'Student deleted'); }
  catch (err) { next(err); }
};

export const transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.transferStudent(req.params.id, req.tenant!.schoolId, req.body.targetSchoolId);
    success(res, null, 'Student transferred');
  } catch (err) { next(err); }
};

export const linkParent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.linkParent(req.params.id, req.tenant!.schoolId, req.body.parentId), 'Parent linked'); }
  catch (err) { next(err); }
};

export const bulkImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const result = await svc.bulkImport(req.tenant!.schoolId, req.file.path);
    success(res, { imported: result.length }, 'Students imported', 201);
  } catch (err) { next(err); }
};
