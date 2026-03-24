import { Request } from 'express';
import { AuditLog } from '../models';

export const logAction = async (
  userId: string,
  schoolId: string,
  action: string,
  entity: string,
  entityId: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>,
  req?: Request
): Promise<void> => {
  await AuditLog.create({
    userId,
    schoolId,
    action,
    entity,
    entityId,
    oldData,
    newData,
    ip: req?.ip,
  });
};
