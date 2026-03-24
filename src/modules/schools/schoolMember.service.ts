import { createError } from '../../middleware/errorHandler.middleware';
import { logAction } from '../../services/audit.service';
import { DEFAULT_ROLE_PERMISSIONS, Role } from '../../config/constants';
import { PermissionModel, RolePermission } from '../../models';
import * as repo from './schoolMember.repository';
import { Request } from 'express';

// Ensures RolePermission rows exist for this role (idempotent)
const ensureRolePermissions = async (role: Role): Promise<void> => {
  const permKeys = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  const permissions = await PermissionModel.findAll({ where: { key: permKeys } });
  await Promise.all(
    permissions.map((p) =>
      RolePermission.findOrCreate({
        where:    { role, permissionId: p.id },
        defaults: { role, permissionId: p.id },
      })
    )
  );
};

export const getMembers = (schoolId: string) =>
  repo.findMembersBySchool(schoolId);

export const assignMember = async (
  actorSchoolId: string,       // from req.user.schoolId (JWT) — HEAD_TEACHER's school
  requestedSchoolId: string,   // from URL param
  isGlobalAdmin: boolean,
  userId: string,
  role: Role,
  actorId: string,
  req: Request
) => {
  // HEAD_TEACHER can only assign to their own school
  // SYSTEM_ADMIN (isGlobalAdmin) can assign to any school
  if (!isGlobalAdmin && actorSchoolId !== requestedSchoolId) {
    throw createError('You can only manage members of your own school', 403);
  }

  // HEAD_TEACHER cannot assign SYSTEM_ADMIN role
  if (!isGlobalAdmin && role === Role.SYSTEM_ADMIN) {
    throw createError('Cannot assign SYSTEM_ADMIN role', 403);
  }

  const schoolId = requestedSchoolId;

  const [schoolRole, created] = await repo.assignMember(userId, schoolId, role);
  if (!created) {
    await repo.updateMemberRole(userId, schoolId, role);
  }

  // Ensure all permissions for this role are linked
  await ensureRolePermissions(role);

  await logAction(
    actorId, schoolId,
    created ? 'CREATE' : 'UPDATE',
    'SchoolRole', schoolRole.id,
    undefined, { userId, schoolId, role }, req
  );

  return repo.findMemberRole(userId, schoolId);
};

export const updateMemberRole = async (
  actorSchoolId: string,
  requestedSchoolId: string,
  isGlobalAdmin: boolean,
  userId: string,
  role: Role,
  actorId: string,
  req: Request
) => {
  if (!isGlobalAdmin && actorSchoolId !== requestedSchoolId) {
    throw createError('You can only manage members of your own school', 403);
  }
  if (!isGlobalAdmin && role === Role.SYSTEM_ADMIN) {
    throw createError('Cannot assign SYSTEM_ADMIN role', 403);
  }

  const existing = await repo.findMemberRole(userId, requestedSchoolId);
  if (!existing) throw createError('User is not a member of this school', 404);

  const [, [updated]] = await repo.updateMemberRole(userId, requestedSchoolId, role);

  // Ensure permissions for new role are linked
  await ensureRolePermissions(role);

  await logAction(
    actorId, requestedSchoolId, 'UPDATE', 'SchoolRole', existing.id,
    { role: existing.role }, { role }, req
  );

  return updated;
};

export const removeMember = async (
  actorSchoolId: string,
  requestedSchoolId: string,
  isGlobalAdmin: boolean,
  userId: string,
  actorId: string,
  req: Request
) => {
  if (!isGlobalAdmin && actorSchoolId !== requestedSchoolId) {
    throw createError('You can only manage members of your own school', 403);
  }

  const existing = await repo.findMemberRole(userId, requestedSchoolId);
  if (!existing) throw createError('User is not a member of this school', 404);

  await repo.removeMember(userId, requestedSchoolId);
  await logAction(
    actorId, requestedSchoolId, 'DELETE', 'SchoolRole', existing.id,
    { userId, role: existing.role }, undefined, req
  );
};
