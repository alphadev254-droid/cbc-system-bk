import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/apiResponse';

export const tenantContext = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.schoolId) {
    error(res, 'Tenant context missing', 400);
    return;
  }
  req.tenant = { schoolId: req.user.schoolId };
  next();
};
