// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/apiResponse';

export const tenantContext = (req: Request, res: Response, next: NextFunction): void => {
  let schoolId = req.user?.schoolId;

  // SYSTEM_ADMIN has no schoolId in token — they pass it in the request body (POST/PUT/PATCH) or query (GET)
  if (!schoolId && req.user?.isGlobalAdmin) {
    schoolId = req.body?.schoolId || req.query?.schoolId as string;
  }

  if (!schoolId) {
    error(res, 'Tenant context missing', 400);
    return;
  }

  req.tenant = { schoolId };
  if (req.user) req.user.schoolId = schoolId;
  next();
};
