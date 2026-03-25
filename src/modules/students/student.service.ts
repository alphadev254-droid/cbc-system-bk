import fs from 'fs';
import bcrypt from 'bcryptjs';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { BCRYPT_ROUNDS, Role, StudentStatus } from '../../config/constants';
import { prisma } from '../../config/prisma';
import * as repo from './student.repository';

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
  [key: string]: unknown;
}) => {
  const existing = await repo.findStudentByAdmissionNumber(data.admissionNumber, schoolId);
  if (existing) throw createError('Admission number already exists', 409);

  const { schoolId: _s, parentId, parentName, parentPhone, curriculumType: ctFromData, ...rest } = data;

  // Only pass known Student fields
  const studentData = {
    admissionNumber: rest.admissionNumber,
    fullName: rest.fullName,
    dob: new Date(rest.dob as unknown as string),
    gender: rest.gender,
    grade: rest.grade,
  };

  // Inherit curriculumType from school if not provided
  let curriculumType = ctFromData;
  if (!curriculumType) {
    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { curriculumType: true } });
    curriculumType = (school?.curriculumType ?? 'CBC') as 'CBC' | 'EIGHT_FOUR_FOUR' | 'BOTH';
  }

  // If parent info provided, create parent user with admissionNumber as password
  let resolvedParentId = parentId as string | undefined;
  if (!resolvedParentId && parentName) {
    const passwordHash = await bcrypt.hash(data.admissionNumber, BCRYPT_ROUNDS);
    // Use admissionNumber@school as a unique internal identifier
    const parentEmail = `${data.admissionNumber}@parent.local`;
    const parent = await prisma.user.create({
      data: {
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
    await prisma.schoolRole.create({
      data: { userId: parent.id, schoolId, role: Role.PARENT, isActive: true },
    });
    resolvedParentId = parent.id;
  }

  return repo.createStudent({
    ...studentData,
    curriculumType,
    school: { connect: { id: schoolId } },
    ...(resolvedParentId && { parent: { connect: { id: resolvedParentId } } }),
  });
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
  return repo.updateStudent(id, data);
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
