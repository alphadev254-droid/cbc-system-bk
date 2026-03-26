// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import * as svc from './notification.service';
import { success } from '../../utils/apiResponse';
import { NotificationChannel } from '../../config/constants';

export const send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const n = await svc.sendNotification({ ...req.body, schoolId: req.tenant!.schoolId });
    success(res, n, 'Notification sent', 201);
  } catch (err) { next(err); }
};

export const bulkNotify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userIds, type, channel, message, phones } = req.body;
    const result = await svc.bulkNotify(req.tenant!.schoolId, userIds, type, channel as NotificationChannel, message, phones);
    success(res, { sent: result.length }, 'Bulk notifications sent');
  } catch (err) { next(err); }
};

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await svc.getNotifications(req.user!.userId, req.tenant!.schoolId, Number(req.query.page) || 1, Number(req.query.limit) || 20);
    success(res, data);
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.markRead(req.params.id, req.user!.userId);
    success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc.markAllRead(req.user!.userId, req.tenant!.schoolId);
    success(res, null, 'All marked as read');
  } catch (err) { next(err); }
};
