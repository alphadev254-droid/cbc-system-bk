import fs from 'fs';
import bcrypt from 'bcryptjs';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { BCRYPT_ROUNDS, Role, StudentStatus } from '../../config/constants';
import { prisma } from '../../config/prisma';
import * as repo from './student.repository';

// Upsert a student's pathway enrollment and save their specific subject selections
const enrollStudentInPathway = async (
  studentId: string,
  pathwayId: string,
  termId: string,
  optionalSubjectIds?: string[]
) => {
  const enrollment = await prisma.studentPathway.upsert({
    where: { studentId_termId: { studentId, termId } },
    create: { studentId, pathwayId, termId, status: 'ACTIVE' },
    update: { pathwayId, status: 'ACTIVE', deletedAt: null },
  });

  // Fetch all pathway subjects to determine compulsory ones
  const pathwaySubjects = await prisma.pathwaySubject.findMany({
    where: { pathwayId },
    select: { subjectId: true, isCompulsory: true },
  });

  // Build the final subject list: all compulsory + chosen optionals
  const chosenOptionals = new Set(optionalSubjectIds ?? []);
  const subjectIds = pathwaySubjects
    .filter((ps) => ps.isCompulsory || chosenOptionals.has(ps.subjectId))
    .map((ps) => ps.subjectId);

  // Replace student's subject selections for this enrollment
  await prisma.studentSubject.deleteMany({ where: { studentPathwayId: enrollment.id } });
  if (subjectIds.length > 0) {
    await prisma.studentSubject.createMany({
      data: subjectIds.map((subjectId) => ({ studentPathwayId: enrollment.id, subjectId })),
      skipDuplicates: true,
    });
  }
};

export const createStudent = async (schoolId: string, data: {
  admissionNumber: string;
  fullName: string;
  dob: Date;
  gender: 'male' | 'female';
  grade: string;
  curriculumType?: 'CBC' | 'EIGHT_FOUR_FOUR' | 'BOTH';
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  pathwayId?: string;
  termId?: string;
  optionalSubjectIds?: string[];
  [key: string]: unknown;
}) => {
  const existing = await repo.findStudentByAdmissionNumber(data.admissionNumber, schoolId);
  if (existing) throw createError('Admission number already exists', 409);

  const { schoolId: _s, parentId, parentName, parentPhone, curriculumType: ctFromData, pathwayId, termId, optionalSubjectIds, ...rest } = data;

  const studentData = {
    admissionNumber: rest.admissionNumber,
    fullName: rest.fullName,
    dob: new Date(rest.dob as string),
    gender: rest.gender,
    grade: rest.grade,
  };

  let curriculumType = ctFromData;
  if (!curriculumType) {
    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { curriculumType: true } });
    curriculumType = (school?.curriculumType ?? 'CBC') as 'CBC' | 'EIGHT_FOUR_FOUR' | 'BOTH';
  }

  let resolvedParentId = parentId as string | undefined;
  if (!resolvedParentId && parentName) {
    const passwordHash = await bcrypt.hash(data.admissionNumber, BCRYPT_ROUNDS);
    const parentEmail = `${data.admissionNumber}@parent.local`;
    const parent = await prisma.user.upsert({
      where: { email: parentEmail },
      update: { name: parentName, phoneNumber: parentPhone ?? null },
      create: {
        name: parentName,
        email: parentEmail,
        phoneNumber: parentPhone ?? null,
        passwordHash,
        role: Role.PARENT,
        schoolId,
        isActive: true,
        twoFactorEnabled: false,
      },
    });
    await prisma.schoolRole.upsert({
      where: { userId_schoolId: { userId: parent.id, schoolId } },
      update: {},
      create: { userId: parent.id, schoolId, role: Role.PARENT, isActive: true },
    });
    resolvedParentId = parent.id;
  }

  const student = await repo.createStudent({
    ...studentData,
    curriculumType,
    school: { connect: { id: schoolId } },
    ...(resolvedParentId && { parent: { connect: { id: resolvedParentId } } }),
  });

  // Enroll in pathway if provided
  if (pathwayId && termId) {
    await enrollStudentInPathway(student.id, pathwayId, termId, optionalSubjectIds);
  }

  return student;
};

export const getStudents = async (schoolId: string, page = 1, limit = 10) => {
  const [rows, count] = await repo.findAllStudents(schoolId, page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const getStudent = async (id: string, schoolId: string) => {
  const student = await repo.findStudentById(id, schoolId);
  if (!student) throw createError('Student not found', 404);
  return student;
};

export const updateStudent = async (id: string, schoolId: string, data: Record<string, unknown>) => {
  await getStudent(id, schoolId);
  const { pathwayId, termId, optionalSubjectIds, ...studentFields } = data as {
    pathwayId?: string; termId?: string; optionalSubjectIds?: string[];
    [key: string]: unknown;
  };
  if (studentFields.dob && typeof studentFields.dob === 'string') {
    studentFields.dob = new Date(studentFields.dob);
  }
  const updated = await repo.updateStudent(id, studentFields);
  if (pathwayId && termId) {
    await enrollStudentInPathway(id, pathwayId, termId, optionalSubjectIds);
  }
  return updated;
};

export const deactivateStudent = async (id: string, schoolId: string) => {
  await getStudent(id, schoolId);
  return repo.updateStudent(id, { status: 'inactive' });
};

export const deleteStudent = async (id: string, schoolId: string) => {
  await getStudent(id, schoolId);
  return repo.deleteStudent(id);
};

export const transferStudent = async (id: string, schoolId: string, targetSchoolId: string) => {
  await getStudent(id, schoolId);
  return repo.updateStudent(id, {
    status: StudentStatus.TRANSFERRED,
    school: { connect: { id: targetSchoolId } },
  });
};

export const linkParent = async (id: string, schoolId: string, parentId: string) => {
  await getStudent(id, schoolId);
  return repo.updateStudent(id, { parent: { connect: { id: parentId } } });
};

export const bulkImport = async (schoolId: string, filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines   = content.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim());

  const records = lines.slice(1).map((line) => {
    const values: Record<string, string> = {};
    line.split(',').forEach((v, i) => { values[headers[i]] = v.trim(); });
    return { ...values, schoolId };
  });

  return repo.bulkCreateStudents(records as never);
};
