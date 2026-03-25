import { Router } from 'express';
import * as ctrl from './school.controller';
import * as memberCtrl from './schoolMember.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSchoolSchema, updateSchoolSchema } from './school.validator';
import { assignMemberSchema, updateMemberRoleSchema } from './schoolMember.validator';
import { Role } from '../../config/constants';

const router = Router();

// School CRUD — SYSTEM_ADMIN only
router.get('/',    authenticate, authorize(Role.SYSTEM_ADMIN), ctrl.getAll);
router.post('/',   authenticate, authorize(Role.SYSTEM_ADMIN), validate(createSchoolSchema), ctrl.create);
router.get('/:id/dashboard', authenticate, authorize(Role.SYSTEM_ADMIN), ctrl.getDashboard);
router.post('/:id/resend-credentials', authenticate, authorize(Role.SYSTEM_ADMIN), ctrl.resendCredentials);
router.get('/:id', authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER), ctrl.getOne);
router.put('/:id', authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER), validate(updateSchoolSchema), ctrl.update);
router.delete('/:id', authenticate, authorize(Role.SYSTEM_ADMIN), ctrl.remove);

// School members — HEAD_TEACHER or SYSTEM_ADMIN
router.get('/:schoolId/members',
  authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER),
  memberCtrl.listMembers);

router.post('/:schoolId/members',
  authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER),
  validate(assignMemberSchema), memberCtrl.assignMember);

router.patch('/:schoolId/members/:userId',
  authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER),
  validate(updateMemberRoleSchema), memberCtrl.updateMemberRole);

router.delete('/:schoolId/members/:userId',
  authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER),
  memberCtrl.removeMember);

export default router;
