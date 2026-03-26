// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './subject.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSubjectSchema, updateSubjectSchema } from './subject.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/',
  requirePermission(Permission.VIEW_SUBJECTS),
  ctrl.getAll);

router.post('/',
  requirePermission(Permission.MANAGE_SUBJECTS),
  validate(createSubjectSchema),
  ctrl.create);

router.get('/:id',
  requirePermission(Permission.VIEW_SUBJECTS),
  ctrl.getOne);

router.put('/:id',
  requirePermission(Permission.MANAGE_SUBJECTS),
  validate(updateSubjectSchema),
  ctrl.update);

router.delete('/:id',
  requirePermission(Permission.MANAGE_SUBJECTS),
  ctrl.remove);

export default router;
