import { SchoolRole, PermissionModel, RolePermission, School, User } from '../models';
import { Role } from '../config/constants';
import { RoleContext } from '../types';

/**
 * Resolves the full role context for a user in a given school.
 *
 * - If schoolId is null → looks for a global SYSTEM_ADMIN SchoolRole (schoolId IS NULL)
 * - If schoolId is provided → looks for a school-scoped SchoolRole
 * - Loads all permissions for that role from RolePermission → Permission
 * - Returns null if no active SchoolRole found
 *
 * Use this anywhere you need to know what a user can do:
 *   const ctx = await resolveRoleContext(userId, schoolId);
 */
export const resolveRoleContext = async (
  userId: string,
  schoolId: string | null
): Promise<RoleContext | null> => {
  // Find the SchoolRole for this user+school combination
  const schoolRole = await SchoolRole.findOne({
    where: {
      userId,
      ...(schoolId ? { schoolId } : { schoolId: null }),
      isActive: true,
    },
  });

  if (!schoolRole) return null;

  // Load permissions for this role
  const rolePermissions = await RolePermission.findAll({
    where: { role: schoolRole.role },
    include: [{ model: PermissionModel, as: 'permission', attributes: ['key'] }],
  });

  const permissions = rolePermissions.map(
    (rp) => (rp as unknown as { permission: { key: string } }).permission.key
  );

  // Load school info if scoped
  let school: RoleContext['school'] = null;
  if (schoolId) {
    const schoolRecord = await School.findByPk(schoolId, {
      attributes: ['id', 'name', 'curriculumType'],
    });
    if (schoolRecord) {
      school = {
        id: schoolRecord.id,
        name: schoolRecord.name,
        curriculumType: schoolRecord.curriculumType,
      };
    }
  }

  return {
    userId,
    schoolId,
    role: schoolRole.role,
    permissions,
    isGlobalAdmin: schoolRole.role === Role.SYSTEM_ADMIN && schoolId === null,
    school,
  };
};

/**
 * Returns all schools a user has an active role in,
 * with their role and permissions per school.
 * Useful for multi-school dashboards or user profile pages.
 */
export const getUserSchools = async (userId: string): Promise<RoleContext[]> => {
  const schoolRoles = await SchoolRole.findAll({
    where: { userId, isActive: true },
    include: [{ model: School, as: undefined, attributes: ['id', 'name', 'curriculumType'] }],
  });

  return Promise.all(
    schoolRoles.map((sr) => resolveRoleContext(userId, sr.schoolId))
  ).then((results) => results.filter(Boolean) as RoleContext[]);
};

/**
 * Checks if a user has a specific permission in a school.
 * Convenience wrapper around resolveRoleContext.
 */
export const userHasPermission = async (
  userId: string,
  schoolId: string | null,
  permission: string
): Promise<boolean> => {
  const ctx = await resolveRoleContext(userId, schoolId);
  if (!ctx) return false;
  if (ctx.isGlobalAdmin) return true; // SYSTEM_ADMIN has everything
  return ctx.permissions.includes(permission);
};

/**
 * Gets just the role for a user in a school — lightweight, no permission loading.
 * Use when you only need to check the role, not full permissions.
 */
export const getUserRoleInSchool = async (
  userId: string,
  schoolId: string | null
): Promise<Role | null> => {
  const schoolRole = await SchoolRole.findOne({
    where: {
      userId,
      ...(schoolId ? { schoolId } : { schoolId: null }),
      isActive: true,
    },
  });
  return schoolRole?.role ?? null;
};
