import { createError } from '../../middleware/errorHandler.middleware';
import { getGrade, computeAggregate } from '../../utils/grading';
import { CurriculumType } from '../../config/constants';
import { getStudentSubjects } from '../pathways/pathway.repository';
import * as repo from './exam.repository';

const validateSubjectForStudent = async (
  studentId: string,
  subjectId: string,
  termId: string,
  schoolId: string
): Promise<void> => {
  const result = await getStudentSubjects(studentId, termId, schoolId);
  if (result.subjects.length === 0) return;

  const validIds = result.subjects.map((s) => s.id);
  if (!validIds.includes(subjectId)) {
    throw createError(
      `Subject is not part of this student's pathway (${result.pathwayName}) for this term`,
      422
    );
  }
};

export const createExamType = (schoolId: string, data: {
  name: string;
  weight: number;
  termId: string;
}) =>
  repo.createExamType({
    name:   data.name,
    weight: data.weight,
    school: { connect: { id: schoolId } },
    term:   { connect: { id: data.termId } },
  });

export const getExamTypes = (schoolId: string, termId: string) =>
  repo.findExamTypesByTerm(schoolId, termId);

export const enterMarks = async (
  data: { studentId: string; subjectId: string; examTypeId: string; termId: string; score: number; maxScore?: number },
  schoolId: string
) => {
  await validateSubjectForStudent(data.studentId, data.subjectId, data.termId, schoolId);
  return repo.upsertStudentMark({
    score:    data.score,
    maxScore: data.maxScore ?? 100,
    student:  { connect: { id: data.studentId } },
    subject:  { connect: { id: data.subjectId } },
    examType: { connect: { id: data.examTypeId } },
    term:     { connect: { id: data.termId } },
  });
};

export const bulkEnterMarks = async (
  marks: Array<{ studentId: string; subjectId: string; examTypeId: string; termId: string; score: number; maxScore?: number }>,
  schoolId: string
) => {
  await Promise.all(
    marks.map((m) => validateSubjectForStudent(m.studentId, m.subjectId, m.termId, schoolId))
  );
  return Promise.all(marks.map((m) => enterMarks(m, schoolId)));
};

export const approveMark = async (id: string, approvedBy: string) => {
  const mark = await repo.findMarkById(id);
  if (!mark) throw createError('Mark not found', 404);
  return repo.approveMarkById(id, approvedBy);
};

export const getStudentMarks = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType
) => {
  const marks = await repo.findMarksByStudent(studentId, termId);
  return marks.map((m) => {
    const percentage = Math.round((Number(m.score) / Number(m.maxScore)) * 100);
    return { ...m, percentage, grade: getGrade(percentage, curriculum) };
  });
};

export const computeStudentAggregate = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType
) => {
  const marks  = await repo.findMarksByStudent(studentId, termId);
  const points = marks.map((m) =>
    getGrade(Math.round((Number(m.score) / Number(m.maxScore)) * 100), curriculum).points
  );
  return { totalPoints: computeAggregate(points), subjectCount: marks.length };
};
