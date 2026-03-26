// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './academicYear.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createYearSchema, createTermSchema } from './academicYear.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/',
  requirePermission(Permission.VIEW_ACADEMIC),
  ctrl.getAll);

router.post('/',
  requirePermission(Permission.MANAGE_ACADEMIC),
  validate(createYearSchema),
  ctrl.create);

router.patch('/:id/activate',
  requirePermission(Permission.MANAGE_ACADEMIC),
  ctrl.activate);

router.put('/:id',
  requirePermission(Permission.MANAGE_ACADEMIC),
  ctrl.updateYear);

router.post('/terms',
  requirePermission(Permission.MANAGE_ACADEMIC),
  validate(createTermSchema),
  ctrl.addTerm);

router.patch('/terms/:termId/activate',
  requirePermission(Permission.MANAGE_ACADEMIC),
  ctrl.activateTerm);

router.put('/terms/:termId',
  requirePermission(Permission.MANAGE_ACADEMIC),
  ctrl.updateTerm);

router.delete('/:id',
  requirePermission(Permission.MANAGE_ACADEMIC),
  ctrl.removeYear);

router.delete('/terms/:termId',
  requirePermission(Permission.MANAGE_ACADEMIC),
  ctrl.removeTerm);

export default router;
