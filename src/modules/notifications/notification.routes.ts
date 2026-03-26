// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { sendNotificationSchema, bulkNotifySchema } from './notification.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

// Any authenticated user can read their own notifications
router.get('/me',        ctrl.getMyNotifications);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);

// Sending requires permission
router.post('/',
  requirePermission(Permission.SEND_NOTIFICATIONS),
  validate(sendNotificationSchema),
  ctrl.send);

router.post('/bulk',
  requirePermission(Permission.SEND_NOTIFICATIONS),
  validate(bulkNotifySchema),
  ctrl.bulkNotify);

export default router;
