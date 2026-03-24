import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './pathway.controller';
import * as v from './pathway.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

// Pathway CRUD
router.get('/',
  requirePermission(Permission.VIEW_PATHWAYS),
  ctrl.getPathways);

router.post('/',
  requirePermission(Permission.MANAGE_PATHWAYS),
  validate(v.createPathwaySchema),
  ctrl.createPathway);

router.get('/:id',
  requirePermission(Permission.VIEW_PATHWAYS),
  ctrl.getPathwayById);

router.put('/:id',
  requirePermission(Permission.MANAGE_PATHWAYS),
  validate(v.updatePathwaySchema),
  ctrl.updatePathway);

router.delete('/:id',
  requirePermission(Permission.MANAGE_PATHWAYS),
  ctrl.deletePathway);

// Subject management
router.post('/:id/subjects',
  requirePermission(Permission.MANAGE_PATHWAYS),
  validate(v.addSubjectsSchema),
  ctrl.addSubjects);

router.delete('/:id/subjects/:subjectId',
  requirePermission(Permission.MANAGE_PATHWAYS),
  ctrl.removeSubject);

// Student enrollment
router.post('/:id/enroll',
  requirePermission(Permission.ENROLL_PATHWAYS),
  validate(v.enrollStudentSchema),
  ctrl.enrollStudent);

router.post('/:id/bulk-enroll',
  requirePermission(Permission.ENROLL_PATHWAYS),
  validate(v.bulkEnrollSchema),
  ctrl.bulkEnroll);

router.get('/:id/students',
  requirePermission(Permission.VIEW_PATHWAYS),
  ctrl.getStudentsInPathway);

// Student-specific
router.get('/student/:studentId/subjects',
  requirePermission(Permission.VIEW_PATHWAYS),
  ctrl.getStudentSubjects);

router.post('/student/:studentId/transfer',
  requirePermission(Permission.MANAGE_PATHWAYS),
  validate(v.transferStudentSchema),
  ctrl.transferStudent);

export default router;
