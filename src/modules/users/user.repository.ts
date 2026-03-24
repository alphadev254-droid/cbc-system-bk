import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findAllUsers = (schoolId: string, page: number, limit: number) =>
  prisma.$transaction([
    prisma.user.findMany({
      where:   { schoolId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true },
    }),
    prisma.user.count({ where: { schoolId } }),
  ]);

export const findUserById = (id: string, schoolId: string) =>
  prisma.user.findFirst({
    where:  { id, schoolId },
    select: { id: true, name: true, email: true, role: true, isActive: true, schoolId: true },
  });

export const findUserByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email } });

export const createUser = (data: Prisma.UserCreateInput) =>
  prisma.user.create({ data });

export const updateUser = (id: string, schoolId: string, data: Prisma.UserUpdateInput) =>
  prisma.user.update({ where: { id }, data });
