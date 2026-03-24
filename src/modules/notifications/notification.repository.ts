import { Notification } from '../../models';
import { NotificationAttributes } from '../../models/Notification.model';
import { paginate } from '../../utils/pagination';

export const createNotification = (data: Partial<NotificationAttributes>) =>
  Notification.create(data as NotificationAttributes);

export const findNotificationsByUser = (userId: string, schoolId: string, page: number, limit: number) =>
  Notification.findAndCountAll({
    where: { userId, schoolId },
    ...paginate(page, limit),
    order: [['createdAt', 'DESC']],
  });

export const markNotificationRead = (id: string, userId: string) =>
  Notification.update({ isRead: true }, { where: { id, userId } });

export const markAllNotificationsRead = (userId: string, schoolId: string) =>
  Notification.update({ isRead: true }, { where: { userId, schoolId } });
