/**
 * seed.ts
 *
 * Runs on every server startup — fully idempotent (safe to run multiple times).
 *
 * Order:
 *  1. Seed all Permission rows
 *  2. Seed RolePermission rows for every role
 *  3. Check if a SYSTEM_ADMIN user exists — create one if not
 *
 * To add a new permission in future:
 *  1. Add the key to the Permission enum in config/constants.ts
 *  2. Add a description below in PERMISSION_DESCRIPTIONS
 *  3. Add it to the relevant role(s) in DEFAULT_ROLE_PERMISSIONS in config/constants.ts
 *  4. Restart the server — seeder picks it up automatically
 */

import bcrypt from 'bcryptjs';
import { Permission, DEFAULT_ROLE_PERMISSIONS, Role, BCRYPT_ROUNDS } from '../config/constants';
import { PermissionModel, RolePermission, User, SchoolRole } from '../models';
import logger from '../config/logger';

// ─── Permission descriptions ──────────────────────────────────────────────────
// Add a description here whenever you add a new Permission enum value
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

// ─── Step 1: Seed permissions ─────────────────────────────────────────────────
const seedPermissions = async (): Promise<Map<string, string>> => {
  const permissionKeys = Object.values(Permission);

  await Promise.all(
    permissionKeys.map((key) =>
      PermissionModel.findOrCreate({
        where:    { key },
        defaults: { key, description: PERMISSION_DESCRIPTIONS[key] },
      })
    )
  );

  // Return key → id map for use in step 2
  const all    = await PermissionModel.findAll();
  const permMap = new Map(all.map((p) => [p.key, p.id]));

  logger.info(`[Seed] Permissions: ${permissionKeys.length} entries ensured`);
  return permMap;
};

// ─── Step 2: Seed role → permission links ─────────────────────────────────────
const seedRolePermissions = async (permMap: Map<string, string>): Promise<void> => {
  for (const role of Object.values(Role)) {
    const permKeys = DEFAULT_ROLE_PERMISSIONS[role] ?? [];

    await Promise.all(
      permKeys.map((key) => {
        const permissionId = permMap.get(key);
        if (!permissionId) {
          logger.warn(`[Seed] Permission key "${key}" not found in DB — skipping`);
          return;
        }
        return RolePermission.findOrCreate({
          where:    { role, permissionId },
          defaults: { role, permissionId },
        });
      })
    );

    logger.info(`[Seed] RolePermissions: ${role} → ${permKeys.length} permissions ensured`);
  }
};

// ─── Step 3: Seed system admin user ───────────────────────────────────────────
const seedSystemAdmin = async (): Promise<void> => {
  // Check if any SYSTEM_ADMIN SchoolRole exists (schoolId = null = global admin)
  const existingAdminRole = await SchoolRole.findOne({
    where: { role: Role.SYSTEM_ADMIN, schoolId: null, isActive: true },
  });

  if (existingAdminRole) {
    logger.info('[Seed] System admin already exists — skipping');
    return;
  }

  // Read credentials from env — must be set before first run
  const adminEmail    = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName     = process.env.SEED_ADMIN_NAME ?? 'System Administrator';

  if (!adminEmail || !adminPassword) {
    logger.warn(
      '[Seed] SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set in .env — skipping system admin creation'
    );
    return;
  }

  // Check if user with this email already exists
  let adminUser = await User.findOne({ where: { email: adminEmail } });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
    adminUser = await User.create({
      name:             adminName,
      email:            adminEmail,
      passwordHash,
      role:             Role.SYSTEM_ADMIN,
      schoolId:         '',   // no school — global admin
      isActive:         true,
      twoFactorEnabled: false,
    });
    logger.info(`[Seed] System admin user created: ${adminEmail}`);
  }

  // Create global SchoolRole (schoolId = null)
  await SchoolRole.create({
    userId:   adminUser.id,
    schoolId: null,
    role:     Role.SYSTEM_ADMIN,
    isActive: true,
  });

  logger.info(`[Seed] System admin SchoolRole created for: ${adminEmail}`);
};

// ─── Main entry point ─────────────────────────────────────────────────────────
export const runSeed = async (): Promise<void> => {
  try {
    logger.info('[Seed] Starting...');

    const permMap = await seedPermissions();
    await seedRolePermissions(permMap);
    await seedSystemAdmin();

    logger.info('[Seed] Completed successfully');
  } catch (err) {
    logger.error('[Seed] Failed:', err);
    throw err;
  }
};

// Run directly when called as a script: npm run seed
if (require.main === module) {
  import('../config/database').then(({ sequelize }) => {
    sequelize.authenticate()
      .then(() => runSeed())
      .then(() => process.exit(0))
      .catch((err) => { logger.error(err); process.exit(1); });
  });
}
