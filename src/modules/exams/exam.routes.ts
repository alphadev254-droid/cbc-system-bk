// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './exam.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createExamTypeSchema, updateExamTypeSchema, enterMarksSchema, bulkMarksSchema } from './exam.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/types',
  requirePermission(Permission.VIEW_MARKS),
  ctrl.getExamTypes);

router.post('/types',
  requirePermission(Permission.MANAGE_EXAMS),
  validate(createExamTypeSchema),
  ctrl.createExamType);

router.delete('/types/:id',
  requirePermission(Permission.MANAGE_EXAMS),
  ctrl.removeExamType);

router.patch('/types/:id',
  requirePermission(Permission.MANAGE_EXAMS),
  validate(updateExamTypeSchema),
  ctrl.updateExamType);

router.post('/marks',
  requirePermission(Permission.ENTER_MARKS),
  validate(enterMarksSchema),
  ctrl.enterMarks);

router.post('/marks/bulk',
  requirePermission(Permission.ENTER_MARKS),
  validate(bulkMarksSchema),
  ctrl.bulkEnterMarks);

router.patch('/marks/:id/approve',
  requirePermission(Permission.APPROVE_MARKS),
  ctrl.approveMark);

router.get('/marks/:studentId',
  requirePermission(Permission.VIEW_MARKS),
  ctrl.getStudentMarks);

export default router;
