// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './report.service';
import { success } from '../../utils/apiResponse';
import { CurriculumType } from '../../config/constants';

export const reportCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, termId, curriculum } = req.query;
    const pdf = await svc.generateReportCard(studentId as string, termId as string, (curriculum as CurriculumType) || CurriculumType.CBC, req.tenant!.schoolId);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="report-card.pdf"` });
    res.send(pdf);
  } catch (err) { next(err); }
};

export const classPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.classPerformance(req.query.subjectId as string, req.query.termId as string)); }
  catch (err) { next(err); }
};

export const feeCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.feeCollectionReport(req.tenant!.schoolId, req.query.termId as string)); }
  catch (err) { next(err); }
};

export const enrollment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.enrollmentStats(req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const teacherClassData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await svc.getTeacherClassData(req.tenant!.schoolId, req.user!.userId);
    success(res, data);
  } catch (err: any) {
    if (err.statusCode === 404) { res.status(404).json({ success: false, message: err.message }); return; }
    next(err);
  }
};
