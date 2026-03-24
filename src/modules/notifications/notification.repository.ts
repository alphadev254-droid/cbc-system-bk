import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const createNotification = (data: Prisma.NotificationCreateInput) =>
  prisma.notification.create({ data });

export const findNotificationsByUser = (userId: string, schoolId: string, page: number, limit: number) =>
  prisma.$transaction([
    prisma.notification.findMany({
      where:   { userId, schoolId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId, schoolId } }),
  ]);

export const markNotificationRead = (id: string, userId: string) =>
  prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });

export const markAllNotificationsRead = (userId: string, schoolId: string) =>
  prisma.notification.updateMany({ where: { userId, schoolId }, data: { isRead: true } });
