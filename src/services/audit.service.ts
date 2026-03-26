// @ts-nocheck
import { Request } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

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
oldData: oldData ? (oldData as unknown as Prisma.InputJsonValue) : undefined,
newData: newData ? (newData as unknown as Prisma.InputJsonValue) : undefined,
      ip: req?.ip,
    },
  });
};
