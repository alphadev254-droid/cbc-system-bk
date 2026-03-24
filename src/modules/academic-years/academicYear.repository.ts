import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findAllAcademicYears = (schoolId: string) =>
  prisma.academicYear.findMany({
    where:   { schoolId },
    include: { terms: true },
    orderBy: { year: 'desc' },
  });

export const findAcademicYearById = (id: string, schoolId: string) =>
  prisma.academicYear.findFirst({
    where:   { id, schoolId },
    include: { terms: true },
  });

export const createAcademicYear = (schoolId: string, year: string) =>
  prisma.academicYear.create({ data: { schoolId, year } });

export const setAcademicYearActive = (id: string, schoolId: string) =>
  prisma.$transaction([
    prisma.academicYear.updateMany({ where: { schoolId }, data: { isActive: false } }),
    prisma.academicYear.update({ where: { id }, data: { isActive: true } }),
  ]);

export const createTerm = (data: Prisma.TermCreateInput) =>
  prisma.term.create({ data });

export const findTermById = (id: string, schoolId: string) =>
  prisma.term.findFirst({ where: { id, schoolId } });

export const setTermActive = (id: string, schoolId: string) =>
  prisma.$transaction([
    prisma.term.updateMany({ where: { schoolId }, data: { isActive: false } }),
    prisma.term.update({ where: { id }, data: { isActive: true } }),
  ]);
