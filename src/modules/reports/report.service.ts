import { QueryTypes } from 'sequelize';
import { generatePDF } from '../../services/pdf.service';
import { CurriculumType } from '../../config/constants';
import { getGrade, computeAggregate } from '../../utils/grading';
import { Student, FeeRecord, StudentPathway, Pathway } from '../../models';
import { sequelize } from '../../config/database';
import { findMarksByStudent, findMarksBySubjectAndTerm } from '../exams/exam.repository';

export const generateReportCard = async (
  studentId: string,
  termId: string,
  curriculum: CurriculumType
): Promise<Buffer> => {
  const student = await Student.findByPk(studentId, { include: [{ association: 'school' }] });
  if (!student) throw new Error('Student not found');

  const marks = await findMarksByStudent(studentId, termId);
  const approvedMarks = marks.filter((m) => m.approvedBy != null);

  const marksWithGrades = approvedMarks.map((m) => {
    const pct = Math.round((m.score / m.maxScore) * 100);
    return { ...m.toJSON(), percentage: pct, grade: getGrade(pct, curriculum) };
  });

  const aggregate = computeAggregate(marksWithGrades.map((m) => m.grade.points));

  // Fetch pathway enrollment for this student + term
  const enrollment = await StudentPathway.findOne({
    where: { studentId, termId, status: 'ACTIVE' },
    include: [{ model: Pathway, as: 'pathway', attributes: ['name', 'gradeLevel'] }],
  });

  const pathwayName       = (enrollment as unknown as { pathway?: { name: string; gradeLevel: string } })?.pathway?.name ?? null;
  const pathwayGradeLevel = (enrollment as unknown as { pathway?: { name: string; gradeLevel: string } })?.pathway?.gradeLevel ?? null;

  const templateName = curriculum === CurriculumType.CBC ? 'report-card-cbc' : 'report-card-844';

  return generatePDF(templateName, {
    student: student.toJSON(),
    marks:   marksWithGrades,
    aggregate,
    termId,
    pathwayName,
    pathwayGradeLevel,
  });
};

export const classPerformance = async (subjectId: string, termId: string) => {
  const marks  = await findMarksBySubjectAndTerm(subjectId, termId);
  const scores = marks.map((m) => Math.round((m.score / m.maxScore) * 100));
  const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { subjectId, termId, average: avg.toFixed(2), count: marks.length, marks };
};

export const feeCollectionReport = async (schoolId: string, termId: string) => {
  const records = await FeeRecord.findAll({
    where: { termId },
    include: [{ association: 'student', where: { schoolId } }, { association: 'payments' }],
  });
  const totalExpected  = records.reduce((s, r) => s + Number(r.amount), 0);
  const totalCollected = records.reduce((s, r) => s + Number(r.paidAmount), 0);
  return { totalExpected, totalCollected, balance: totalExpected - totalCollected, records };
};

export const enrollmentStats = async (schoolId: string) =>
  sequelize.query<{ grade: string; count: string }>(
    `SELECT grade, COUNT(*) as count FROM students WHERE "schoolId" = :schoolId AND status = 'active' GROUP BY grade ORDER BY grade`,
    { replacements: { schoolId }, type: QueryTypes.SELECT }
  );
