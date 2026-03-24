import { Router } from 'express';
import * as ctrl from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/report-card',
  requirePermission(Permission.VIEW_REPORTS),
  ctrl.reportCard);

router.get('/class-performance',
  requirePermission(Permission.VIEW_REPORTS),
  ctrl.classPerformance);

router.get('/fee-collection',
  requirePermission(Permission.VIEW_REPORTS),
  ctrl.feeCollection);

router.get('/enrollment',
  requirePermission(Permission.VIEW_REPORTS),
  ctrl.enrollment);

export default router;
