import { createError } from '../../middleware/errorHandler.middleware';
import { SubjectAttributes } from '../../models/Subject.model';
import * as repo from './subject.repository';

export const createSubject = (schoolId: string, data: Partial<SubjectAttributes>) =>
  repo.createSubject({ ...data, schoolId });

export const getSubjects = (schoolId: string) => repo.findAllSubjects(schoolId);

export const getSubject = async (id: string, schoolId: string) => {
  const subject = await repo.findSubjectById(id, schoolId);
  if (!subject) throw createError('Subject not found', 404);
  return subject;
};

export const updateSubject = async (id: string, schoolId: string, data: Partial<SubjectAttributes>) => {
  await getSubject(id, schoolId);
  const [, [updated]] = await repo.updateSubject(id, schoolId, data);
  return updated;
};

export const deleteSubject = async (id: string, schoolId: string) => {
  await getSubject(id, schoolId);
  await repo.deleteSubject(id, schoolId);
};
