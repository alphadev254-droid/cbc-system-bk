import { prisma } from '../../config/prisma';
import type { Prisma, Role } from '@prisma/client';

export const findAllUsers = (
  schoolId: string,
  page: number,
  limit: number,
  role?: Role
) =>
  prisma.$transaction([
    prisma.user.findMany({
      where:   { schoolId, ...(role ? { role } : {}) },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, email: true, phoneNumber: true, employeeNumber: true, role: true, isActive: true, lastLogin: true },
    }),
    prisma.user.count({ where: { schoolId, ...(role ? { role } : {}) } }),
  ]);

export const findUserById = (id: string, schoolId: string) =>
  prisma.user.findFirst({
    where:  { id, schoolId },
    select: { id: true, name: true, email: true, phoneNumber: true, employeeNumber: true, role: true, isActive: true, schoolId: true, lastLogin: true },
  });

export const findUserByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email } });

export const createUser = (data: Prisma.UserUncheckedCreateInput) =>
  prisma.user.create({ data });

export const deleteUser = (id: string, schoolId: string) =>
  prisma.user.deleteMany({ where: { id, schoolId } });

export const updateUser = async (
  id: string,
  schoolId: string,
  data: Prisma.UserUncheckedUpdateInput
) => {
  const r = await prisma.user.updateMany({ where: { id, schoolId }, data });
  if (r.count === 0) return null;
  return prisma.user.findFirst({
    where:  { id, schoolId },
    select: { id: true, name: true, email: true, phoneNumber: true, employeeNumber: true, role: true, isActive: true, schoolId: true },
  });
};
