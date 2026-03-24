import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS, DEFAULT_ROLE_PERMISSIONS, Role } from '../../config/constants';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { logAction } from '../../services/audit.service';
import prisma from '../../config/prisma';
import * as repo from './user.repository';
import { Request } from 'express';

export const createUser = async (
  data: { name: string; email: string; password: string; role: Role; schoolId: string },
  actorId: string,
  req: Request
) => {
  const existing = await repo.findUserByEmail(data.email);
  if (existing) throw createError('Email already in use', 409);

  const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
  if (!school) throw createError('School not found', 404);

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await repo.createUser({
    name:             data.name,
    email:            data.email,
    passwordHash,
    role:             data.role,
    school:           { connect: { id: data.schoolId } },
    isActive:         true,
    twoFactorEnabled: false,
  });

  // Create SchoolRole — links user to school with their role
  await prisma.schoolRole.create({
    data: { userId: user.id, schoolId: data.schoolId, role: data.role, isActive: true },
  });

  // Ensure RolePermission rows exist for this role
  const permKeys    = DEFAULT_ROLE_PERMISSIONS[data.role] ?? [];
  const permissions = await prisma.permission.findMany({ where: { key: { in: permKeys } } });
  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where:  { role_permissionId: { role: data.role, permissionId: p.id } },
        create: { role: data.role, permissionId: p.id },
        update: {},
      })
    )
  );

  await logAction(
    actorId, data.schoolId, 'CREATE', 'User', user.id,
    undefined,
    { name: user.name, email: user.email, role: data.role, schoolId: data.schoolId },
    req
  );

  return { id: user.id, name: user.name, email: user.email, role: data.role, schoolId: data.schoolId };
};

export const getUsers = async (schoolId: string, page = 1, limit = 10) => {
  const [rows, count] = await repo.findAllUsers(schoolId, page, limit);
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
  data: { name?: string; email?: string; isActive?: boolean },
  actorId: string,
  req: Request
) => {
  const user = await getUser(id, schoolId);
  const updated = await repo.updateUser(id, schoolId, data);
  await logAction(actorId, schoolId, 'UPDATE', 'User', id,
    user as unknown as Record<string, unknown>,
    data as Record<string, unknown>, req);
  return updated;
};

export const deactivateUser = async (
  id: string,
  schoolId: string,
  actorId: string,
  req: Request
) => {
  await updateUser(id, schoolId, { isActive: false }, actorId, req);
  await prisma.schoolRole.updateMany({
    where: { userId: id, schoolId },
    data:  { isActive: false },
  });
};
