// @ts-nocheck
import { Router } from 'express';
import * as ctrl from './fee.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createFeeTypeSchema, assignFeeSchema, recordPaymentSchema } from './fee.validator';
import { Permission } from '../../config/constants';

const router = Router();
router.use(authenticate, tenantContext);

router.get('/types',
  requirePermission(Permission.VIEW_FEES),
  ctrl.getFeeTypes);

router.post('/types',
  requirePermission(Permission.MANAGE_FEES),
  validate(createFeeTypeSchema),
  ctrl.createFeeType);

router.post('/assign',
  requirePermission(Permission.MANAGE_FEES),
  validate(assignFeeSchema),
  ctrl.assignFee);

router.post('/payments',
  requirePermission(Permission.RECORD_PAYMENTS),
  validate(recordPaymentSchema),
  ctrl.recordPayment);

router.get('/statement/:studentId',
  requirePermission(Permission.VIEW_FEES),
  ctrl.getFeeStatement);

router.get('/balances',
  requirePermission(Permission.VIEW_FEES),
  ctrl.checkBalances);

export default router;
