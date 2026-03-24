import { Subject } from '../../models';
import { SubjectAttributes } from '../../models/Subject.model';

export const findAllSubjects = (schoolId: string) =>
  Subject.findAll({ where: { schoolId }, order: [['name', 'ASC']] });

export const findSubjectById = (id: string, schoolId: string) =>
  Subject.findOne({ where: { id, schoolId } });

export const createSubject = (data: Partial<SubjectAttributes>) => Subject.create(data as SubjectAttributes);

export const updateSubject = (id: string, schoolId: string, data: Partial<SubjectAttributes>) =>
  Subject.update(data, { where: { id, schoolId }, returning: true });

export const deleteSubject = (id: string, schoolId: string) =>
  Subject.destroy({ where: { id, schoolId } });
