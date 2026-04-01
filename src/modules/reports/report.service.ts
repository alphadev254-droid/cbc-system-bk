// @ts-nocheck
import { prisma } from '../../config/prisma';
import { generatePDF } from '../../services/pdf.service';
import { CurriculumType } from '../../config/constants';
import { getGrade, computeAggregate } from '../../utils/grading';
import { findMarksByStudent, findMarksBySubjectAndTerm } from '../exams/exam.repository';

export const generateReportCard = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType,
  schoolId: string
): Promise<Buffer> => {
  const student = await prisma.student.findFirst({
    where:   { id: studentId, schoolId },
    include: { school: true },
  });
  if (!student) throw new Error('Student not found');

  const marks         = await findMarksByStudent(studentId, termId, schoolId);
  const approvedMarks = marks.filter((m) => m.approvedBy != null);

  const marksWithGrades = approvedMarks.map((m) => {
    const pct = Math.round((Number(m.score) / Number(m.maxScore)) * 100);
    return { ...m, percentage: pct, grade: getGrade(pct, curriculum) };
  });

  const aggregate = computeAggregate(marksWithGrades.map((m) => m.grade.points));

  const enrollment = await prisma.studentPathway.findFirst({
    where:   { studentId, termId, status: 'ACTIVE' },
    include: { pathway: { select: { name: true, gradeLevel: true } } },
  });

  const templateName = curriculum === CurriculumType.CBC ? 'report-card-cbc' : 'report-card-844';

  return generatePDF(templateName, {
    student,
    marks: marksWithGrades,
    aggregate,
    termId,
    pathwayName:       enrollment?.pathway?.name ?? null,
    pathwayGradeLevel: enrollment?.pathway?.gradeLevel ?? null,
  });
};

export const classPerformance = async (subjectId: string, termId: string) => {
  const marks  = await findMarksBySubjectAndTerm(subjectId, termId);
  const scores = marks.map((m) => Math.round((Number(m.score) / Number(m.maxScore)) * 100));
  const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { subjectId, termId, average: avg.toFixed(2), count: marks.length, marks };
};

export const feeCollectionReport = async (schoolId: string, termId: string) => {
  const records = await prisma.feeRecord.findMany({
    where:   { termId, student: { schoolId } },
    include: { payments: true, feeType: true, student: true },
  });
  const totalExpected  = records.reduce((s, r) => s + Number(r.amount), 0);
  const totalCollected = records.reduce((s, r) => s + Number(r.paidAmount), 0);
  return { totalExpected, totalCollected, balance: totalExpected - totalCollected, records };
};

export const enrollmentStats = async (schoolId: string) =>
  prisma.student.groupBy({
    by:     ['grade'],
    where:  { schoolId, status: 'active' },
    _count: { id: true },
    orderBy: { grade: 'asc' },
  });

export const getTeacherClassData = async (schoolId: string, userId: string) => {
  // 1. Find the class this teacher is assigned to
  const assignedClass = await prisma.schoolClass.findFirst({
    where:   { schoolId, classTeacherId: userId },
    include: { pathway: { select: { id: true, name: true } } },
  });
  if (!assignedClass) throw Object.assign(new Error('No assigned class found for this teacher'), { statusCode: 404 });

  // 2. Derive stream label — matches student.grade
  const streamLabel = `${assignedClass.gradeLevel} ${assignedClass.name}`.trim();

  // 3. Fetch students in that stream
  const students = await prisma.student.findMany({
    where:   { schoolId, grade: streamLabel, status: 'active' },
    select:  { id: true, admissionNumber: true, fullName: true, grade: true },
    orderBy: { fullName: 'asc' },
  });

  // 4. Academic years + terms
  const academicYears = await prisma.academicYear.findMany({
    where:   { schoolId },
    include: { terms: { select: { id: true, termNumber: true, isActive: true }, orderBy: { termNumber: 'asc' } } },
    orderBy: { year: 'desc' },
  });

  // 5. All exam types for the school (frontend filters by selected term)
  const examTypes = await prisma.examType.findMany({
    where:   { schoolId },
    select:  { id: true, name: true, weight: true, termId: true },
    orderBy: { createdAt: 'asc' },
  });

  // 6. Teacher-subject mappings for the school
  const teacherMappings = await prisma.teacherSubject.findMany({
    where:   { schoolId },
    select:  { subjectId: true, gradeLevel: true, user: { select: { name: true } } },
  });

  // 7. School info
  const school = await prisma.school.findUnique({
    where:  { id: schoolId },
    select: { name: true, logo: true, county: true, gradingCriteria: true },
  });

  return {
    assignedClass: {
      id:         assignedClass.id,
      name:       assignedClass.name,
      gradeLevel: assignedClass.gradeLevel,
      streamLabel,
      pathway:    assignedClass.pathway ?? null,
    },
    school,
    students,
    academicYears,
    examTypes,
    teacherMappings,
  };
};
