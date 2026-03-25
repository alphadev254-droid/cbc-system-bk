import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { logAction } from '../../services/audit.service';
import { prisma } from '../../config/prisma';
import * as repo from './school.repository';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export const createSchool = async (
  data: Prisma.SchoolCreateInput,
  creatorUserId: string,
  req: Request
) => {
  const existing = await repo.findSchoolByName(data.name);
  if (existing) throw createError('School with this name already exists', 409);

  const school = await repo.createSchool(data);

  await logAction(
    creatorUserId, school.id, 'CREATE', 'School', school.id,
    undefined, school as unknown as Record<string, unknown>, req
  );

  return school;
};

export const getSchools = async (page = 1, limit = 10) => {
  const [rows, count] = await repo.findAllSchools(page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const getSchool = async (id: string) => {
  const school = await repo.findSchoolById(id);
  if (!school) throw createError('School not found', 404);
  return school;
};

export const updateSchool = async (
  id: string,
  data: Prisma.SchoolUpdateInput,
  userId: string,
  req: Request
) => {
  const school  = await getSchool(id);
  const updated = await repo.updateSchool(id, data);
  await logAction(userId, id, 'UPDATE', 'School', id,
    school as unknown as Record<string, unknown>,
    data as unknown as Record<string, unknown>, req);
  return updated;
};

export const deleteSchool = async (id: string, userId: string, req: Request) => {
  await getSchool(id);
  await prisma.$transaction([
    prisma.studentPathway.deleteMany({ where: { pathway: { schoolId: id } } }),
    prisma.pathwaySubject.deleteMany({ where: { pathway: { schoolId: id } } }),
    prisma.pathway.deleteMany({ where: { schoolId: id } }),
    prisma.mark.deleteMany({ where: { subject: { schoolId: id } } }),
    prisma.payment.deleteMany({ where: { student: { schoolId: id } } }),
    prisma.feeRecord.deleteMany({ where: { student: { schoolId: id } } }),
    prisma.feeType.deleteMany({ where: { schoolId: id } }),
    prisma.examType.deleteMany({ where: { schoolId: id } }),
    prisma.term.deleteMany({ where: { academicYear: { schoolId: id } } }),
    prisma.academicYear.deleteMany({ where: { schoolId: id } }),
    prisma.notification.deleteMany({ where: { schoolId: id } }),
    prisma.subject.deleteMany({ where: { schoolId: id } }),
    prisma.student.deleteMany({ where: { schoolId: id } }),
    prisma.schoolRole.deleteMany({ where: { schoolId: id } }),
    prisma.subscription.deleteMany({ where: { schoolId: id } }),
    prisma.auditLog.deleteMany({ where: { schoolId: id } }),
    prisma.user.updateMany({ where: { schoolId: id }, data: { schoolId: null } }),
  ]);
  await repo.deleteSchool(id);
  // log to null schoolId since school is now deleted
  await logAction(userId, '', 'DELETE', 'School', id, undefined, undefined, req).catch(() => {});
};
