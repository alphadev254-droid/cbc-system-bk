// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './pathway.service';
import { success } from '../../utils/apiResponse';

export const createPathway = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pathway = await svc.createPathway(req.tenant!.schoolId, req.user!.userId, req.body, req);
    success(res, pathway, 'Pathway created', 201);
  } catch (err) { next(err); }
};

export const getPathways = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gradeLevel, academicYearId, isActive } = req.query;
    const data = await svc.getPathways(req.tenant!.schoolId, {
      gradeLevel:     gradeLevel as string | undefined,
      academicYearId: academicYearId as string | undefined,
      isActive:       isActive !== undefined ? isActive === 'true' : undefined,
    });
    success(res, data);
  } catch (err) { next(err); }
};

export const getPathwayById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.getPathway(req.params.id, req.tenant!.schoolId));
  } catch (err) { next(err); }
};

export const updatePathway = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await svc.updatePathway(req.params.id, req.tenant!.schoolId, req.user!.userId, req.body, req);
    success(res, updated, 'Pathway updated');
  } catch (err) { next(err); }
};

export const deletePathway = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.deletePathway(req.params.id, req.tenant!.schoolId, req.user!.userId, req);
    success(res, null, 'Pathway deleted');
  } catch (err) { next(err); }
};

export const addSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjects: Array<{ subjectId: string; isCompulsory: boolean }> = req.body.subjects ?? [];
    const updated = await svc.addSubjectsToPathway(req.params.id, req.tenant!.schoolId, subjects, req.user!.userId, req);
    success(res, updated, 'Subjects updated');
  } catch (err) { next(err); }
};

export const removeSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.removeSubjectFromPathway(req.params.id, req.tenant!.schoolId, req.params.subjectId, req.user!.userId, req);
    success(res, null, 'Subject removed from pathway');
  } catch (err) { next(err); }
};

export const enrollStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.enrollStudent(req.params.id, req.tenant!.schoolId, req.body.studentId, req.body.termId, req.user!.userId, req);
    success(res, result, 'Student enrolled', 201);
  } catch (err) { next(err); }
};

export const bulkEnroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.bulkEnroll(req.params.id, req.tenant!.schoolId, req.body.studentIds, req.body.termId, req.user!.userId, req);
    success(res, result, 'Bulk enrollment complete');
  } catch (err) { next(err); }
};

export const getStudentsInPathway = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    success(res, await svc.getStudentsInPathway(req.params.id, req.query.termId as string));
  } catch (err) { next(err); }
};

export const getStudentSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.getStudentSubjects(req.params.studentId, req.tenant!.schoolId);
    success(res, result);
  } catch (err) { next(err); }
};

export const transferStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { toPathwayId, toTermId } = req.body;
    await svc.transferStudentPathway(req.params.studentId, req.query.termId as string, toPathwayId, toTermId, req.tenant!.schoolId, req.user!.userId, req);
    success(res, null, 'Student transferred to new pathway');
  } catch (err) { next(err); }
};
