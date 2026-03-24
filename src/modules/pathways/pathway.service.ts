import { Request } from 'express';
import { createError } from '../../middleware/errorHandler.middleware';
import { logAction } from '../../services/audit.service';
import { AcademicYear, Subject, Student, Term } from '../../models';
import { BulkEnrollResult, StudentSubjectsResult } from '../../types';
import * as repo from './pathway.repository';

// ─── Pathway CRUD ─────────────────────────────────────────────────────────────

export const createPathway = async (
  schoolId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    gradeLevel: string;
    academicYearId: string;
    subjectIds: string[];
    isCompulsoryMap?: Record<string, boolean>;
  },
  req: Request
) => {
  // 1. Verify academicYear belongs to this school
  const year = await AcademicYear.findOne({ where: { id: data.academicYearId, schoolId } });
  if (!year) throw createError('Academic year not found for this school', 404);

  // 2. Verify all subjects belong to this school
  const subjects = await Subject.findAll({ where: { schoolId } });
  const schoolSubjectIds = subjects.map((s) => s.id);
  const invalid = data.subjectIds.filter((id) => !schoolSubjectIds.includes(id));
  if (invalid.length) throw createError(`Subjects not found in this school: ${invalid.join(', ')}`, 422);

  // 3. Create pathway
  const pathway = await repo.createPathway({
    schoolId,
    academicYearId: data.academicYearId,
    name:           data.name,
    description:    data.description,
    gradeLevel:     data.gradeLevel,
  });

  // 4. Build PathwaySubject records
  const subjectEntries = data.subjectIds.map((subjectId) => ({
    subjectId,
    isCompulsory: data.isCompulsoryMap?.[subjectId] ?? true,
  }));
  await repo.addSubjectsToPathway(pathway.id, subjectEntries);

  await logAction(userId, schoolId, 'CREATE', 'Pathway', pathway.id, undefined, pathway.toJSON() as Record<string, unknown>, req);

  return repo.findPathwayById(pathway.id, schoolId);
};

export const getPathways = (
  schoolId: string,
  filters: { gradeLevel?: string; academicYearId?: string; isActive?: boolean }
) => repo.findAllPathways(schoolId, filters);

export const getPathway = async (id: string, schoolId: string) => {
  const pathway = await repo.findPathwayById(id, schoolId);
  if (!pathway) throw createError('Pathway not found', 404);
  return pathway;
};

export const updatePathway = async (
  id: string,
  schoolId: string,
  userId: string,
  data: Partial<{ name: string; description: string; isActive: boolean }>,
  req: Request
) => {
  const pathway = await getPathway(id, schoolId);

  const [, [updated]] = await repo.updatePathway(id, schoolId, data);
  await logAction(userId, schoolId, 'UPDATE', 'Pathway', id,
    pathway.toJSON() as Record<string, unknown>, data as Record<string, unknown>, req);

  return updated;
};

export const deletePathway = async (id: string, schoolId: string, userId: string, req: Request) => {
  await getPathway(id, schoolId);

  const enrollmentCount = await repo.countActiveEnrollments(id);
  if (enrollmentCount > 0) {
    throw createError(
      `Cannot delete a pathway that has ${enrollmentCount} active student enrollment(s). Transfer students first.`,
      409
    );
  }

  await repo.softDeletePathway(id, schoolId);
  await logAction(userId, schoolId, 'DELETE', 'Pathway', id, undefined, undefined, req);
};

// ─── Subject management ───────────────────────────────────────────────────────

export const addSubjectsToPathway = async (
  pathwayId: string,
  schoolId: string,
  subjectIds: string[],
  isCompulsory: boolean,
  userId: string,
  req: Request
) => {
  await getPathway(pathwayId, schoolId);

  // Verify subjects belong to school
  const subjects = await Subject.findAll({ where: { schoolId } });
  const schoolSubjectIds = subjects.map((s) => s.id);
  const invalid = subjectIds.filter((id) => !schoolSubjectIds.includes(id));
  if (invalid.length) throw createError(`Subjects not found in this school: ${invalid.join(', ')}`, 422);

  await repo.addSubjectsToPathway(pathwayId, subjectIds.map((subjectId) => ({ subjectId, isCompulsory })));
  await logAction(userId, schoolId, 'UPDATE', 'Pathway', pathwayId, undefined, { addedSubjects: subjectIds }, req);

  return repo.findPathwayById(pathwayId, schoolId);
};

export const removeSubjectFromPathway = async (
  pathwayId: string,
  schoolId: string,
  subjectId: string,
  userId: string,
  req: Request
) => {
  await getPathway(pathwayId, schoolId);

  // Check if any student has marks for this subject in this pathway
  const hasMarks = await repo.findMarksForSubjectInPathway(pathwayId, subjectId);
  if (hasMarks) {
    throw createError('Cannot remove a subject that already has student marks recorded', 409);
  }

  await repo.removeSubjectFromPathway(pathwayId, subjectId);
  await logAction(userId, schoolId, 'UPDATE', 'Pathway', pathwayId, undefined, { removedSubject: subjectId }, req);
};

// ─── Student enrollment ───────────────────────────────────────────────────────

export const enrollStudent = async (
  pathwayId: string,
  schoolId: string,
  studentId: string,
  termId: string,
  userId: string,
  req: Request
) => {
  const pathway = await getPathway(pathwayId, schoolId);
  if (!pathway.isActive) throw createError('Pathway is not active', 409);

  // Verify student belongs to school
  const student = await Student.findOne({ where: { id: studentId, schoolId } });
  if (!student) throw createError('Student not found in this school', 404);

  // Verify term belongs to school
  const term = await Term.findOne({ where: { id: termId, schoolId } });
  if (!term) throw createError('Term not found in this school', 404);

  // Check not already enrolled in any pathway for this term
  const existing = await repo.findStudentEnrollmentForTerm(studentId, termId);
  if (existing) throw createError('Student is already enrolled in a pathway for this term', 409);

  const enrollment = await repo.enrollStudent({ studentId, pathwayId, termId });
  await logAction(userId, schoolId, 'CREATE', 'StudentPathway', enrollment.id,
    undefined, { studentId, pathwayId, termId }, req);

  // Warn if grade mismatch
  const warning = student.grade !== pathway.gradeLevel
    ? `Student grade (${student.grade}) does not match pathway grade level (${pathway.gradeLevel})`
    : undefined;

  return { enrollment, ...(warning && { warning }) };
};

export const bulkEnroll = async (
  pathwayId: string,
  schoolId: string,
  studentIds: string[],
  termId: string,
  userId: string,
  req: Request
): Promise<BulkEnrollResult> => {
  await getPathway(pathwayId, schoolId);

  const term = await Term.findOne({ where: { id: termId, schoolId } });
  if (!term) throw createError('Term not found in this school', 404);

  const validIds: string[]  = [];
  const skipped:  string[]  = [];
  const errors: BulkEnrollResult['errors'] = [];

  await Promise.all(
    studentIds.map(async (studentId) => {
      const student = await Student.findOne({ where: { id: studentId, schoolId } });
      if (!student) {
        errors.push({ studentId, reason: 'Student not found in this school' });
        return;
      }
      const existing = await repo.findStudentEnrollmentForTerm(studentId, termId);
      if (existing) {
        skipped.push(studentId);
        return;
      }
      validIds.push(studentId);
    })
  );

  const enrolled = await repo.bulkEnrollStudents(validIds, pathwayId, termId);
  await logAction(userId, schoolId, 'CREATE', 'StudentPathway', pathwayId,
    undefined, { enrolled, skipped: skipped.length, errors: errors.length }, req);

  return { enrolled, skipped, errors };
};

export const getStudentsInPathway = (pathwayId: string, termId: string) =>
  repo.getStudentsInPathway(pathwayId, termId);

export const getStudentSubjects = async (
  studentId: string,
  termId: string,
  schoolId: string
): Promise<StudentSubjectsResult> => {
  // Verify student belongs to school
  const student = await Student.findOne({ where: { id: studentId, schoolId } });
  if (!student) throw createError('Student not found in this school', 404);

  return repo.getStudentSubjects(studentId, termId, schoolId);
};

export const transferStudentPathway = async (
  studentId: string,
  currentTermId: string,
  toPathwayId: string,
  toTermId: string,
  schoolId: string,
  userId: string,
  req: Request
) => {
  await getPathway(toPathwayId, schoolId);

  const current = await repo.findStudentEnrollmentForTerm(studentId, currentTermId);
  if (!current) throw createError('Student has no active pathway enrollment for this term', 404);

  await repo.transferStudent(studentId, currentTermId, toPathwayId, toTermId);
  await logAction(userId, schoolId, 'UPDATE', 'StudentPathway', current.id,
    { pathwayId: current.pathwayId, termId: currentTermId },
    { toPathwayId, toTermId }, req);
};
