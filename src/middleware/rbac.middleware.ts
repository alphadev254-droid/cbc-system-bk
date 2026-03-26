// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/constants';
import { error } from '../utils/apiResponse';

// Role-based check — authorize('HEAD_TEACHER', 'SYSTEM_ADMIN')
export const authorize = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { error(res, 'Unauthorized', 401); return; }
    if (req.user.isGlobalAdmin) { next(); return; } // SYSTEM_ADMIN bypasses all
    if (!roles.includes(req.user.role)) {
      error(res, 'Forbidden: insufficient role', 403);
      return;
    }
    next();
  };

// Permission-based check — requirePermission('enter:marks')
export const requirePermission = (...perms: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { error(res, 'Unauthorized', 401); return; }
    if (req.user.isGlobalAdmin) { next(); return; }
    const hasAll = perms.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) {
      error(res, `Forbidden: missing permission(s): ${perms.join(', ')}`, 403);
      return;
    }
    next();
  };

// Checks either role OR permission — flexible for mixed routes
export const authorizeAny = (roles: Role[], perms: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { error(res, 'Unauthorized', 401); return; }
    if (req.user.isGlobalAdmin) { next(); return; }
    const hasRole = roles.includes(req.user.role);
    const hasPerm = perms.some((p) => req.user!.permissions.includes(p));
    if (!hasRole && !hasPerm) {
      error(res, 'Forbidden: insufficient role or permissions', 403);
      return;
    }
    next();
  };
