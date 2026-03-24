import { Permission, DEFAULT_ROLE_PERMISSIONS, Role } from '../config/constants';
import { PermissionModel, RolePermission } from '../models';
import logger from '../config/logger';

const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permission.MANAGE_SCHOOL]:        'Create, update, delete school settings',
  [Permission.VIEW_SCHOOL]:          'View school details',
  [Permission.MANAGE_USERS]:         'Create, update, deactivate users',
  [Permission.VIEW_USERS]:           'View user list',
  [Permission.MANAGE_STUDENTS]:      'Create, update, transfer students',
  [Permission.VIEW_STUDENTS]:        'View student records',
  [Permission.MANAGE_ACADEMIC]:      'Manage academic years and terms',
  [Permission.VIEW_ACADEMIC]:        'View academic years and terms',
  [Permission.MANAGE_SUBJECTS]:      'Create, update, delete subjects',
  [Permission.VIEW_SUBJECTS]:        'View subjects',
  [Permission.MANAGE_PATHWAYS]:      'Create, update, delete pathways',
  [Permission.VIEW_PATHWAYS]:        'View pathways',
  [Permission.ENROLL_PATHWAYS]:      'Enroll students into pathways',
  [Permission.MANAGE_EXAMS]:         'Create and manage exam types',
  [Permission.ENTER_MARKS]:          'Enter student marks',
  [Permission.APPROVE_MARKS]:        'Approve entered marks',
  [Permission.VIEW_MARKS]:           'View student marks',
  [Permission.MANAGE_FEES]:          'Create and manage fee types',
  [Permission.RECORD_PAYMENTS]:      'Record fee payments',
  [Permission.VIEW_FEES]:            'View fee records',
  [Permission.VIEW_REPORTS]:         'Generate and view reports',
  [Permission.SEND_NOTIFICATIONS]:   'Send notifications to users',
  [Permission.MANAGE_SUBSCRIPTIONS]: 'Manage subscription tiers and assignments',
};

export const seedPermissions = async (): Promise<void> => {
  try {
    // 1. Upsert all Permission records
    const permissionKeys = Object.values(Permission);
    await Promise.all(
      permissionKeys.map((key) =>
        PermissionModel.findOrCreate({
          where: { key },
          defaults: { key, description: PERMISSION_DESCRIPTIONS[key] },
        })
      )
    );

    // 2. Load all permissions into a key→id map
    const allPermissions = await PermissionModel.findAll();
    const permMap = new Map(allPermissions.map((p) => [p.key, p.id]));

    // 3. Upsert RolePermission records for each role
    for (const role of Object.values(Role)) {
      const perms = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
      await Promise.all(
        perms.map((permKey) => {
          const permissionId = permMap.get(permKey);
          if (!permissionId) return;
          return RolePermission.findOrCreate({
            where: { role, permissionId },
            defaults: { role, permissionId },
          });
        })
      );
    }

    logger.info('Permissions seeded successfully');
  } catch (err) {
    logger.error('Permission seeding failed:', err);
    throw err;
  }
};
