// @ts-nocheck
import { createError } from '../../middleware/errorHandler.middleware';
import { logAction } from '../../services/audit.service';
import { DEFAULT_ROLE_PERMISSIONS, Role } from '../../config/constants';
import { prisma } from '../../config/prisma';
import * as repo from './schoolMember.repository';
import { Request } from 'express';

const ensureRolePermissions = async (role: Role): Promise<void> => {
  const permKeys    = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  const permissions = await prisma.permission.findMany({ where: { key: { in: permKeys } } });
  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where:  { role_permissionId: { role, permissionId: p.id } },
        create: { role, permissionId: p.id },
        update: {},
      })
    )
  );
};

export const getMembers = (schoolId: string) =>
  repo.findMembersBySchool(schoolId);

export const assignMember = async (
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

  const schoolRole = await repo.assignMember(userId, requestedSchoolId, role);
  await ensureRolePermissions(role);
  await logAction(actorId, requestedSchoolId, 'CREATE', 'SchoolRole', schoolRole.id,
    undefined, { userId, schoolId: requestedSchoolId, role }, req);

  return schoolRole;
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

  const updated = await repo.updateMemberRole(userId, requestedSchoolId, role);
  await ensureRolePermissions(role);
  await logAction(actorId, requestedSchoolId, 'UPDATE', 'SchoolRole', existing.id,
    { role: existing.role }, { role }, req);

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
  await logAction(actorId, requestedSchoolId, 'DELETE', 'SchoolRole', existing.id,
    { userId, role: existing.role }, undefined, req);
};
