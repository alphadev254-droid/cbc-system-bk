// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './schoolClass.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSchoolClassSchema, updateSchoolClassSchema } from './schoolClass.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/', requirePermission(Permission.VIEW_ACADEMIC), ctrl.list);
router.post(
  '/',
  requirePermission(Permission.MANAGE_ACADEMIC),
  validate(createSchoolClassSchema),
  ctrl.create
);
router.put(
  '/:id',
  requirePermission(Permission.MANAGE_ACADEMIC),
  validate(updateSchoolClassSchema),
  ctrl.update
);
router.delete('/:id', requirePermission(Permission.MANAGE_ACADEMIC), ctrl.remove);

export default router;
