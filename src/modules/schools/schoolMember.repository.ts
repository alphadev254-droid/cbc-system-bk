import { prisma } from '../../config/prisma';
import { Role } from '../../config/constants';

export const findMembersBySchool = (schoolId: string) =>
  prisma.schoolRole.findMany({
    where: { schoolId, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

export const findMemberRole = (userId: string, schoolId: string) =>
  prisma.schoolRole.findFirst({ where: { userId, schoolId } });

export const assignMember = (userId: string, schoolId: string, role: Role) =>
  prisma.schoolRole.upsert({
    where:  { userId_schoolId: { userId, schoolId } },
    create: { userId, schoolId, role, isActive: true },
    update: { role, isActive: true },
  });

export const updateMemberRole = (userId: string, schoolId: string, role: Role) =>
  prisma.schoolRole.update({
    where: { userId_schoolId: { userId, schoolId } },
    data:  { role, isActive: true },
  });

export const removeMember = (userId: string, schoolId: string) =>
  prisma.schoolRole.update({
    where: { userId_schoolId: { userId, schoolId } },
    data:  { isActive: false },
  });
