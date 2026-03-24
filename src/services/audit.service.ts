import { Request } from 'express';
import prisma from '../config/prisma';

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
  await prisma.auditLog.create({
    data: {
      userId,
      schoolId,
      action,
      entity,
      entityId,
      oldData: oldData ?? undefined,
      newData: newData ?? undefined,
      ip: req?.ip,
    },
  });
};
