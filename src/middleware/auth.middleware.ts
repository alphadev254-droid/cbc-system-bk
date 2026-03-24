import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/tokenHelper';
import { resolveRoleContext } from '../services/roleContext.service';
import { Role } from '../config/constants';
import { error } from '../utils/apiResponse';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        schoolId: string;
        role: Role;
        permissions: string[];
        isGlobalAdmin: boolean;
      };
      tenant?: { schoolId: string };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    error(res, 'No token provided', 401);
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload: TokenPayload = verifyToken(token, process.env.JWT_SECRET as string);

    // Resolve role + permissions from SchoolRole table
    // Try school-scoped first, fall back to global (schoolId=null) for SYSTEM_ADMIN
    let ctx = await resolveRoleContext(payload.userId, payload.schoolId);

    if (!ctx) {
      // Try global admin (schoolId = null)
      ctx = await resolveRoleContext(payload.userId, null);
    }

    if (!ctx) {
      error(res, 'No access to this school', 403);
      return;
    }

    req.user = {
      userId:        payload.userId,
      schoolId:      payload.schoolId,
      role:          ctx.role,
      permissions:   ctx.permissions,
      isGlobalAdmin: ctx.isGlobalAdmin,
    };

    next();
  } catch {
    error(res, 'Invalid or expired token', 401);
  }
};
