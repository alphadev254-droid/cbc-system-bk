import { Router } from 'express';
import * as ctrl from './student.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createStudentSchema, updateStudentSchema, transferStudentSchema } from './student.validator';
import { uploadCSV, uploadPhoto } from '../../middleware/upload.middleware';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/',
  requirePermission(Permission.VIEW_STUDENTS),
  ctrl.getAll);

router.post('/',
  requirePermission(Permission.MANAGE_STUDENTS),
  validate(createStudentSchema),
  ctrl.create);

router.get('/:id',
  requirePermission(Permission.VIEW_STUDENTS),
  ctrl.getOne);

router.put('/:id',
  requirePermission(Permission.MANAGE_STUDENTS),
  validate(updateStudentSchema),
  ctrl.update);

router.patch('/:id/deactivate',
  requirePermission(Permission.MANAGE_STUDENTS),
  ctrl.deactivate);

router.delete('/:id',
  requirePermission(Permission.MANAGE_STUDENTS),
  ctrl.remove);

router.post('/:id/transfer',
  requirePermission(Permission.MANAGE_STUDENTS),
  validate(transferStudentSchema),
  ctrl.transfer);

router.patch('/:id/link-parent',
  requirePermission(Permission.MANAGE_STUDENTS),
  ctrl.linkParent);

router.post('/bulk-import',
  requirePermission(Permission.MANAGE_STUDENTS),
  uploadCSV,
  ctrl.bulkImport);

router.post('/:id/photo',
  requirePermission(Permission.MANAGE_STUDENTS),
  uploadPhoto,
  ctrl.update);

export default router;
