/**
 * scripts/seed.ts
 *
 * Run manually:  npm run seed
 *
 * What it does:
 *  1. Seeds all Permission rows
 *  2. Seeds RolePermission rows for every role
 *  3. Creates the SYSTEM_ADMIN user if none exists
 *
 * To add a new permission in future:
 *  1. Add key to Permission enum in src/config/constants.ts
 *  2. Add description in PERMISSION_DESCRIPTIONS below
 *  3. Add to relevant role(s) in DEFAULT_ROLE_PERMISSIONS in src/config/constants.ts
 *  4. Run: npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { sequelize } from '../src/config/database';
import logger from '../src/config/logger';
import { Permission, DEFAULT_ROLE_PERMISSIONS, Role, BCRYPT_ROUNDS } from '../src/config/constants';
import { PermissionModel, RolePermission, User, SchoolRole } from '../src/models';

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

  const all     = await PermissionModel.findAll();
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

// ─── Step 3: Seed system admin ────────────────────────────────────────────────
const seedSystemAdmin = async (): Promise<void> => {
  const existingAdminRole = await SchoolRole.findOne({
    where: { role: Role.SYSTEM_ADMIN, schoolId: null, isActive: true },
  });

  if (existingAdminRole) {
    logger.info('[Seed] System admin already exists — skipping');
    return;
  }

  const adminEmail    = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName     = process.env.SEED_ADMIN_NAME ?? 'System Administrator';

  if (!adminEmail || !adminPassword) {
    logger.warn('[Seed] SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set in .env — skipping system admin creation');
    return;
  }

  let adminUser = await User.findOne({ where: { email: adminEmail } });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
    adminUser = await User.create({
      name:             adminName,
      email:            adminEmail,
      passwordHash,
      role:             Role.SYSTEM_ADMIN,
      schoolId:         '',
      isActive:         true,
      twoFactorEnabled: false,
    });
    logger.info(`[Seed] System admin user created: ${adminEmail}`);
  }

  await SchoolRole.create({
    userId:   adminUser.id,
    schoolId: null,
    role:     Role.SYSTEM_ADMIN,
    isActive: true,
  });

  logger.info(`[Seed] System admin SchoolRole created for: ${adminEmail}`);
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('[Seed] Database connected');

    const permMap = await seedPermissions();
    await seedRolePermissions(permMap);
    await seedSystemAdmin();

    logger.info('[Seed] Completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('[Seed] Failed:', err);
    process.exit(1);
  }
};

run();
