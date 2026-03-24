import { Router } from 'express';
import * as ctrl from './subscription.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createTierSchema, updateTierSchema, assignTierSchema } from './subscription.validator';
import { Permission, Role } from '../../config/constants';

const router = Router();
router.use(authenticate, authorize(Role.SYSTEM_ADMIN));

router.get('/tiers',
  requirePermission(Permission.MANAGE_SUBSCRIPTIONS),
  ctrl.getTiers);

router.post('/tiers',
  requirePermission(Permission.MANAGE_SUBSCRIPTIONS),
  validate(createTierSchema),
  ctrl.createTier);

router.put('/tiers/:id',
  requirePermission(Permission.MANAGE_SUBSCRIPTIONS),
  validate(updateTierSchema),
  ctrl.updateTier);

router.post('/assign',
  requirePermission(Permission.MANAGE_SUBSCRIPTIONS),
  validate(assignTierSchema),
  ctrl.assignTier);

export default router;
