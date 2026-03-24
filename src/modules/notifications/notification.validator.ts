import Joi from 'joi';
import { NotificationChannel } from '../../config/constants';

export const sendNotificationSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  type: Joi.string().required(),
  channel: Joi.string().valid(...Object.values(NotificationChannel)).required(),
  message: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  subject: Joi.string().optional(),
  templateName: Joi.string().optional(),
  templateData: Joi.object().optional(),
});

export const bulkNotifySchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  type: Joi.string().required(),
  channel: Joi.string().valid(...Object.values(NotificationChannel)).required(),
  message: Joi.string().required(),
});
