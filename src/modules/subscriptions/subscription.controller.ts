// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './subscription.service';
import { success } from '../../utils/apiResponse';
import { BillingCycle } from '../../config/constants';

export const createTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.createTier(req.body), 'Tier created', 201); }
  catch (err) { next(err); }
};

export const getTiers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.getTiers()); }
  catch (err) { next(err); }
};

export const updateTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { success(res, await svc.updateTier(req.params.id, req.body), 'Tier updated'); }
  catch (err) { next(err); }
};

export const assignTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { schoolId, tierId, billingCycle, startDate } = req.body;
    const sub = await svc.assignTier(schoolId, tierId, billingCycle as BillingCycle, new Date(startDate));
    success(res, sub, 'Subscription assigned', 201);
  } catch (err) { next(err); }
};
