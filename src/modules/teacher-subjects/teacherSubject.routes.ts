// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './teacherSubject.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createTeacherSubjectSchema } from './teacherSubject.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/', requirePermission(Permission.VIEW_SUBJECTS), ctrl.list);
router.post(
  '/',
  requirePermission(Permission.MANAGE_SUBJECTS),
  validate(createTeacherSubjectSchema),
  ctrl.create
);
router.delete('/:id', requirePermission(Permission.MANAGE_SUBJECTS), ctrl.remove);

export default router;
