import { Request, Response, NextFunction } from 'express';
import * as svc from './fee.service';
import { success } from '../../utils/apiResponse';

export const createFeeType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.createFeeType(req.tenant!.schoolId, req.body), 'Fee type created', 201); }
  catch (err) { next(err); }
};

export const getFeeTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getFeeTypes(req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const assignFee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, feeTypeId, termId, dueDate, amount } = req.body;
    success(res, await svc.assignFee(studentId, feeTypeId, termId, new Date(dueDate), amount, req.tenant!.schoolId), 'Fee assigned', 201);
  } catch (err) { next(err); }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.recordPayment(req.body), 'Payment recorded', 201); }
  catch (err) { next(err); }
};

export const getFeeStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getFeeStatement(req.params.studentId, req.query.termId as string, req.tenant!.schoolId)); }
  catch (err) { next(err); }
};

export const checkBalances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.checkBalances(req.tenant!.schoolId)); }
  catch (err) { next(err); }
};
