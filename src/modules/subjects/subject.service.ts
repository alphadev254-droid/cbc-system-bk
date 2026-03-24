import { createError } from '../../middleware/errorHandler.middleware';
import * as repo from './subject.repository';

export const createSubject = (schoolId: string, data: {
  name: string;
  curriculumType: 'CBC' | 'EIGHT_FOUR_FOUR' | 'BOTH';
  gradeLevel: string;
  weeklyHours: number;
}) =>
  repo.createSubject({ ...data, school: { connect: { id: schoolId } } });

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
  return repo.deleteSubject(id);
};
