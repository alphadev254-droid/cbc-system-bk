// @ts-nocheck
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findAllSubjects = (schoolId: string) =>
  prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });

export const findSubjectById = (id: string, schoolId: string) =>
  prisma.subject.findFirst({ where: { id, schoolId } });

export const createSubject = (data: Prisma.SubjectCreateInput) =>
  prisma.subject.create({ data });

export const updateSubject = (id: string, data: Prisma.SubjectUpdateInput) =>
  prisma.subject.update({ where: { id }, data });

export const deleteSubject = (id: string) =>
  prisma.subject.delete({ where: { id } });
