import { Router } from 'express';
import * as ctrl from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requirePermission } from '../../middleware/rbac.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './user.validator';
import { Role, Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

// System admin (any school) or school head (their school only)
router.post('/',
  authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER),
  requirePermission(Permission.MANAGE_USERS),
  validate(createUserSchema),
  ctrl.create);

// List users — needs view:users permission
router.get('/',
  requirePermission(Permission.VIEW_USERS),
  ctrl.getAll);

// Get single user — needs view:users permission
router.get('/:id',
  requirePermission(Permission.VIEW_USERS),
  ctrl.getOne);

// Update user — needs manage:users permission
router.put('/:id',
  requirePermission(Permission.MANAGE_USERS),
  validate(updateUserSchema),
  ctrl.update);

// Deactivate user — needs manage:users permission
router.delete('/:id',
  requirePermission(Permission.MANAGE_USERS),
  ctrl.remove);

router.patch('/:id/deactivate',
  requirePermission(Permission.MANAGE_USERS),
  ctrl.deactivate);

export default router;
