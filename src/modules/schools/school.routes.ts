// @ts-nocheck
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as ctrl from './school.controller';
import * as memberCtrl from './schoolMember.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSchoolSchema, updateSchoolSchema } from './school.validator';
import { assignMemberSchema, updateMemberRoleSchema } from './schoolMember.validator';
import { Role } from '../../config/constants';

import fs from 'fs';

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const LOGOS_DIR   = path.join(UPLOADS_DIR, 'logos');

// Ensure upload directories exist at startup
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, LOGOS_DIR),
    filename:    (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files allowed')),
});

const router = Router();

// Grading criteria — must be before /:id to avoid route conflict
router.get('/grading-criteria', authenticate, tenantContext, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER, Role.TEACHER), ctrl.getGradingCriteria);
router.put('/grading-criteria', authenticate, tenantContext, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER), ctrl.saveGradingCriteria);

// Logo upload — HEAD_TEACHER or SYSTEM_ADMIN
router.post('/:id/logo',
  authenticate, authorize(Role.SYSTEM_ADMIN, Role.HEAD_TEACHER),
  logoUpload.single('logo'), ctrl.uploadLogo);

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
