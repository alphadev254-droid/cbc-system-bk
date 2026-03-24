import { createError } from '../../middleware/errorHandler.middleware';
import { getGrade, computeAggregate } from '../../utils/grading';
import { CurriculumType } from '../../config/constants';
import { ExamTypeAttributes } from '../../models/ExamType.model';
import { MarkAttributes } from '../../models/Mark.model';
import { getStudentSubjects } from '../pathways/pathway.repository';
import * as repo from './exam.repository';

// Validates subject is in student's pathway for the term (if enrolled)
const validateSubjectForStudent = async (
  studentId: string,
  subjectId: string,
  termId: string,
  schoolId: string
): Promise<void> => {
  const result = await getStudentSubjects(studentId, termId, schoolId);
  if (result.subjects.length === 0) return; // not enrolled in pathway — allow (backwards compatible)

  const validIds = result.subjects.map((s) => s.id);
  if (!validIds.includes(subjectId)) {
    throw createError(
      `Subject is not part of this student's pathway (${result.pathwayName}) for this term`,
      422
    );
  }
};

export const createExamType = (schoolId: string, data: Partial<ExamTypeAttributes>) =>
  repo.createExamType({ ...data, schoolId });

export const getExamTypes = (schoolId: string, termId: string) =>
  repo.findExamTypesByTerm(schoolId, termId);

export const enterMarks = async (
  data: Partial<MarkAttributes> & { studentId: string; subjectId: string; termId: string },
  schoolId: string
) => {
  await validateSubjectForStudent(data.studentId, data.subjectId, data.termId, schoolId);
  return repo.upsertStudentMark(data);
};

export const bulkEnterMarks = async (
  marks: Array<Partial<MarkAttributes> & { studentId: string; subjectId: string; termId: string }>,
  schoolId: string
) => {
  await Promise.all(
    marks.map((m) => validateSubjectForStudent(m.studentId, m.subjectId, m.termId, schoolId))
  );
  return Promise.all(marks.map((m) => repo.upsertStudentMark(m)));
};

export const approveMark = async (id: string, approvedBy: string) => {
  const mark = await repo.findMarkById(id);
  if (!mark) throw createError('Mark not found', 404);
  const [, [updated]] = await repo.approveMarkById(id, approvedBy);
  return updated;
};

export const getStudentMarks = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType
) => {
  const marks = await repo.findMarksByStudent(studentId, termId);
  return marks.map((m) => {
    const percentage = Math.round((m.score / m.maxScore) * 100);
    return { ...m.toJSON(), percentage, grade: getGrade(percentage, curriculum) };
  });
};

export const computeStudentAggregate = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType
) => {
  const marks = await repo.findMarksByStudent(studentId, termId);
  const points = marks.map((m) =>
    getGrade(Math.round((m.score / m.maxScore) * 100), curriculum).points
  );
  return { totalPoints: computeAggregate(points), subjectCount: marks.length };
};
