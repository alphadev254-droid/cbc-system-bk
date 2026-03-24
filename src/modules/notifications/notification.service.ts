import { NotificationChannel } from '../../config/constants';
import { sendEmail } from '../../services/email.service';
import { sendSMS, bulkSMS } from '../../services/sms.service';
import { buildPaginationResult } from '../../utils/pagination';
import * as repo from './notification.repository';

interface NotifyOptions {
  schoolId: string;
  userId?: string;
  type: string;
  channel: NotificationChannel;
  message: string;
  email?: string;
  phone?: string;
  subject?: string;
  templateName?: string;
  templateData?: Record<string, unknown>;
}

export const sendNotification = async (opts: NotifyOptions) => {
  const notification = await repo.createNotification({
    schoolId: opts.schoolId,
    userId: opts.userId,
    type: opts.type,
    channel: opts.channel,
    message: opts.message,
    sentAt: new Date(),
  });

  if (opts.channel === NotificationChannel.EMAIL && opts.email) {
    await sendEmail(opts.email, opts.templateName || 'announcement', opts.templateData || { message: opts.message }, opts.subject || opts.type);
  } else if (opts.channel === NotificationChannel.SMS && opts.phone) {
    await sendSMS(opts.phone, opts.message);
  }

  return notification;
};

export const bulkNotify = async (
  schoolId: string,
  userIds: string[],
  type: string,
  channel: NotificationChannel,
  message: string,
  phones?: string[]
) => {
  const notifications = await Promise.all(
    userIds.map((userId) =>
      repo.createNotification({ schoolId, userId, type, channel, message, sentAt: new Date() })
    )
  );

  if (channel === NotificationChannel.SMS && phones?.length) {
    await bulkSMS(phones, message);
  }

  return notifications;
};

export const getNotifications = async (userId: string, schoolId: string, page = 1, limit = 20) => {
  const { rows, count } = await repo.findNotificationsByUser(userId, schoolId, page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const markRead = (id: string, userId: string) => repo.markNotificationRead(id, userId);

export const markAllRead = (userId: string, schoolId: string) => repo.markAllNotificationsRead(userId, schoolId);
