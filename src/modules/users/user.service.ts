import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS, DEFAULT_ROLE_PERMISSIONS, Role } from '../../config/constants';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { logAction } from '../../services/audit.service';
import { SchoolRole, School, PermissionModel, RolePermission } from '../../models';
import * as repo from './user.repository';
import { UserAttributes } from '../../models/User.model';
import { Request } from 'express';

// Resolves all permission IDs for a role from the DB
const resolvePermissionIds = async (role: Role): Promise<string[]> => {
  const permKeys = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  const permissions = await PermissionModel.findAll({ where: { key: permKeys } });
  return permissions.map((p) => p.id);
};

export const createUser = async (
  data: Partial<UserAttributes> & { password: string; role: Role; schoolId: string },
  actorId: string,
  req: Request
) => {
  // 1. Check email not already taken
  const existing = await repo.findUserByEmail(data.email as string);
  if (existing) throw createError('Email already in use', 409);

  // 2. Verify school exists
  const school = await School.findByPk(data.schoolId);
  if (!school) throw createError('School not found', 404);

  // 3. Create User row (no schoolId on User — school is via SchoolRole)
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await repo.createUser({
    name:         data.name,
    email:        data.email,
    passwordHash,
    role:         data.role,   // kept on User for reference
    schoolId:     data.schoolId,
    isActive:     true,
    twoFactorEnabled: false,
  });

  // 4. Create SchoolRole — links user to school with their role
  await SchoolRole.create({
    userId:   user.id,
    schoolId: data.schoolId,
    role:     data.role,
    isActive: true,
  });

  // 5. Ensure RolePermission rows exist for this role (idempotent)
  const permissionIds = await resolvePermissionIds(data.role);
  await Promise.all(
    permissionIds.map((permissionId) =>
      RolePermission.findOrCreate({
        where:    { role: data.role, permissionId },
        defaults: { role: data.role, permissionId },
      })
    )
  );

  await logAction(
    actorId, data.schoolId, 'CREATE', 'User', user.id,
    undefined,
    { name: user.name, email: user.email, role: data.role, schoolId: data.schoolId } as Record<string, unknown>,
    req
  );

  return {
    id:       user.id,
    name:     user.name,
    email:    user.email,
    role:     data.role,
    schoolId: data.schoolId,
  };
};

export const getUsers = async (schoolId: string, page = 1, limit = 10) => {
  const { rows, count } = await repo.findAllUsers(schoolId, page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const getUser = async (id: string, schoolId: string) => {
  const user = await repo.findUserById(id, schoolId);
  if (!user) throw createError('User not found', 404);
  return user;
};

export const updateUser = async (
  id: string,
  schoolId: string,
  data: Partial<UserAttributes>,
  actorId: string,
  req: Request
) => {
  const user = await getUser(id, schoolId);
  const [, [updated]] = await repo.updateUser(id, schoolId, data);
  await logAction(
    actorId, schoolId, 'UPDATE', 'User', id,
    user.toJSON() as Record<string, unknown>,
    data as Record<string, unknown>,
    req
  );
  return updated;
};

export const deactivateUser = async (
  id: string,
  schoolId: string,
  actorId: string,
  req: Request
) => {
  await updateUser(id, schoolId, { isActive: false }, actorId, req);
  // Also deactivate their SchoolRole
  await SchoolRole.update({ isActive: false }, { where: { userId: id, schoolId } });
};
