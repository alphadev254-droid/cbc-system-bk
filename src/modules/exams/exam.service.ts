import { createError } from '../../middleware/errorHandler.middleware';
import { getGrade, computeAggregate } from '../../utils/grading';
import { CurriculumType } from '../../config/constants';
import { getStudentSubjects } from '../pathways/pathway.repository';
import { prisma } from '../../config/prisma';
import * as repo from './exam.repository';

const assertStudentInSchool = async (studentId: string, schoolId: string) => {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw createError('Student not found', 404);
};

const validateSubjectForStudent = async (
  studentId: string,
  subjectId: string,
  schoolId: string
): Promise<void> => {
  const result = await getStudentSubjects(studentId, schoolId);
  if (result.subjects.length === 0) return;

  const validIds = result.subjects.map((s) => s.id);
  if (!validIds.includes(subjectId)) {
    throw createError(
      `Subject is not part of this student's pathway (${result.pathwayName})`,
      422
    );
  }
};

export const createExamType = (schoolId: string, data: {
  name: string;
  weight: number;
  termId: string;
  gradeLevel: string;
  startDate?: string;
  marksDeadline?: string;
}) =>
  repo.createExamType({
    name:          data.name,
    weight:        data.weight,
    gradeLevel:    data.gradeLevel,
    ...(data.startDate     && { startDate:     new Date(data.startDate) }),
    ...(data.marksDeadline && { marksDeadline: new Date(data.marksDeadline) }),
    school: { connect: { id: schoolId } },
    term:   { connect: { id: data.termId } },
  });

export const getExamTypes = (schoolId: string, termId: string) =>
  repo.findExamTypesByTerm(schoolId, termId);

export const updateExamType = async (id: string, schoolId: string, data: {
  name?: string; weight?: number; gradeLevel?: string;
  startDate?: string | null; marksDeadline?: string | null;
}) => {
  const et = await repo.findExamTypeById(id, schoolId);
  if (!et) throw createError('Exam type not found', 404);
  return prisma.examType.update({
    where: { id },
    data: {
      ...(data.name      !== undefined && { name:      data.name }),
      ...(data.weight    !== undefined && { weight:    data.weight }),
      ...(data.gradeLevel !== undefined && { gradeLevel: data.gradeLevel }),
      startDate:     data.startDate     ? new Date(data.startDate)     : data.startDate === null ? null : undefined,
      marksDeadline: data.marksDeadline ? new Date(data.marksDeadline) : data.marksDeadline === null ? null : undefined,
    },
  });
};

export const deleteExamType = async (id: string, schoolId: string) => {
  const et = await repo.findExamTypeById(id, schoolId);
  if (!et) throw createError('Exam type not found', 404);
  await repo.deleteExamType(id, schoolId);
};

export const enterMarks = async (
  data: { studentId: string; subjectId: string; examTypeId: string; termId: string; score: number; maxScore?: number; enteredById?: string; [key: string]: unknown },
  schoolId: string
) => {
  const examType = await repo.findExamTypeById(data.examTypeId, schoolId);
  if (!examType) throw createError('Exam type not found', 404);
  if (examType.marksDeadline && new Date() > new Date(examType.marksDeadline)) {
    throw createError(`Marks submission for "${examType.name}" is closed. Deadline was ${new Date(examType.marksDeadline).toLocaleDateString()}.`, 403);
  }
  await validateSubjectForStudent(data.studentId, data.subjectId, schoolId);
  return repo.upsertStudentMark({
    studentId:   data.studentId,
    subjectId:   data.subjectId,
    examTypeId:  data.examTypeId,
    termId:      data.termId,
    score:       data.score,
    maxScore:    data.maxScore ?? 100,
    enteredById: data.enteredById,
  });
};

export const bulkEnterMarks = async (
  marks: Array<{ studentId: string; subjectId: string; examTypeId: string; termId: string; score: number; maxScore?: number }>,
  schoolId: string,
  enteredById?: string
) => {
  await Promise.all(
    marks.map((m) => validateSubjectForStudent(m.studentId, m.subjectId, schoolId))
  );
  return Promise.all(marks.map((m) => enterMarks({ ...m, enteredById }, schoolId)));
};

export const approveMark = async (id: string, approvedBy: string) => {
  const mark = await repo.findMarkById(id);
  if (!mark) throw createError('Mark not found', 404);
  return repo.approveMarkById(id, approvedBy);
};

export const getStudentMarks = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType,
  schoolId: string
) => {
  await assertStudentInSchool(studentId, schoolId);
  const marks = await repo.findMarksByStudent(studentId, termId, schoolId);
  return marks.map((m) => {
    const percentage = Math.round((Number(m.score) / Number(m.maxScore)) * 100);
    return { ...m, percentage, grade: getGrade(percentage, curriculum) };
  });
};

export const computeStudentAggregate = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType,
  schoolId: string
) => {
  await assertStudentInSchool(studentId, schoolId);
  const marks  = await repo.findMarksByStudent(studentId, termId, schoolId);
  const points = marks.map((m) =>
    getGrade(Math.round((Number(m.score) / Number(m.maxScore)) * 100), curriculum).points
  );
  return { totalPoints: computeAggregate(points), subjectCount: marks.length };
};
