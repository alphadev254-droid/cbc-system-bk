import { ExamType, Mark } from '../../models';
import { ExamTypeAttributes } from '../../models/ExamType.model';
import { MarkAttributes } from '../../models/Mark.model';

export const createExamType = (data: Partial<ExamTypeAttributes>) =>
  ExamType.create(data as ExamTypeAttributes);

export const findExamTypesByTerm = (schoolId: string, termId: string) =>
  ExamType.findAll({ where: { schoolId, termId } });

export const findExamTypeById = (id: string, schoolId: string) =>
  ExamType.findOne({ where: { id, schoolId } });

export const upsertStudentMark = (data: Partial<MarkAttributes>) =>
  Mark.upsert(data as MarkAttributes);

export const findMarkById = (id: string) =>
  Mark.findByPk(id);

export const findMarksByStudent = (studentId: string, termId: string) =>
  Mark.findAll({
    where: { studentId, termId },
    include: [{ association: 'subject' }, { association: 'examType' }],
  });

export const findMarksBySubjectAndTerm = (subjectId: string, termId: string) =>
  Mark.findAll({
    where: { subjectId, termId },
    include: [{ association: 'student' }, { association: 'examType' }],
  });

export const approveMarkById = (id: string, approvedBy: string) =>
  Mark.update({ approvedBy, approvedAt: new Date() }, { where: { id }, returning: true });
