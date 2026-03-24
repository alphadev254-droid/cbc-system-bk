import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findAllSchools = (page: number, limit: number) =>
  prisma.$transaction([
    prisma.school.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.school.count(),
  ]);

export const findSchoolById = (id: string) =>
  prisma.school.findUnique({ where: { id } });

export const findSchoolByName = (name: string) =>
  prisma.school.findUnique({ where: { name } });

export const createSchool = (data: Prisma.SchoolCreateInput) =>
  prisma.school.create({ data });

export const updateSchool = (id: string, data: Prisma.SchoolUpdateInput) =>
  prisma.school.update({ where: { id }, data });

export const deleteSchool = (id: string) =>
  prisma.school.delete({ where: { id } });
