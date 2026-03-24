import { createError } from '../../middleware/errorHandler.middleware';
import { prisma } from '../../config/prisma';
import * as repo from './subject.repository';

export const createSubject = (schoolId: string, data: {
  name: string;
  curriculumType: 'CBC' | 'EIGHT_FOUR_FOUR' | 'BOTH';
  gradeLevel: string;
  weeklyHours: number;
  [key: string]: unknown;
}) => {
  const { schoolId: _s, ...rest } = data;
  return repo.createSubject({ ...rest, school: { connect: { id: schoolId } } });
};

export const getSubjects = (schoolId: string) =>
  repo.findAllSubjects(schoolId);

export const getSubject = async (id: string, schoolId: string) => {
  const subject = await repo.findSubjectById(id, schoolId);
  if (!subject) throw createError('Subject not found', 404);
  return subject;
};

export const updateSubject = async (id: string, schoolId: string, data: Record<string, unknown>) => {
  await getSubject(id, schoolId);
  return repo.updateSubject(id, data);
};

export const deleteSubject = async (id: string, schoolId: string) => {
  await getSubject(id, schoolId);
  // cascade delete marks before deleting subject
  await prisma.mark.deleteMany({ where: { subjectId: id } });
  await prisma.pathwaySubject.deleteMany({ where: { subjectId: id } });
  return repo.deleteSubject(id);
};
