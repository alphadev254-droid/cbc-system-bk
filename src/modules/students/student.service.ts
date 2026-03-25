import fs from 'fs';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { StudentStatus } from '../../config/constants';
import * as repo from './student.repository';

export const createStudent = async (schoolId: string, data: {
  admissionNumber: string;
  fullName: string;
  dob: Date;
  gender: 'male' | 'female';
  grade: string;
  curriculumType: 'CBC' | 'EIGHT_FOUR_FOUR' | 'BOTH';
  parentId?: string;
  [key: string]: unknown;
}) => {
  const existing = await repo.findStudentByAdmissionNumber(data.admissionNumber, schoolId);
  if (existing) throw createError('Admission number already exists', 409);

  const { schoolId: _s, parentId, ...rest } = data;
  return repo.createStudent({
    ...rest,
    school: { connect: { id: schoolId } },
    ...(parentId && { parent: { connect: { id: parentId as string } } }),
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
