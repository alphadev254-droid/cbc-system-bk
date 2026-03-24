import fs from 'fs';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { StudentStatus } from '../../config/constants';
import { StudentAttributes } from '../../models/Student.model';
import * as repo from './student.repository';

export const createStudent = async (schoolId: string, data: Partial<StudentAttributes>) => {
  const existing = await repo.findStudentByAdmissionNumber(data.admissionNumber as string, schoolId);
  if (existing) throw createError('Admission number already exists', 409);
  return repo.createStudent({ ...data, schoolId });
};

export const getStudents = async (schoolId: string, page = 1, limit = 10) => {
  const { rows, count } = await repo.findAllStudents(schoolId, page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const getStudent = async (id: string, schoolId: string) => {
  const student = await repo.findStudentById(id, schoolId);
  if (!student) throw createError('Student not found', 404);
  return student;
};

export const updateStudent = async (id: string, schoolId: string, data: Partial<StudentAttributes>) => {
  await getStudent(id, schoolId);
  const [, [updated]] = await repo.updateStudent(id, schoolId, data);
  return updated;
};

export const transferStudent = async (id: string, schoolId: string, targetSchoolId: string) => {
  await getStudent(id, schoolId);
  await repo.updateStudent(id, schoolId, { status: StudentStatus.TRANSFERRED, schoolId: targetSchoolId });
};

export const linkParent = async (id: string, schoolId: string, parentId: string) => {
  await getStudent(id, schoolId);
  const [, [updated]] = await repo.updateStudent(id, schoolId, { parentId });
  return updated;
};

export const bulkImport = async (schoolId: string, filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim());

  const records = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = values[i]; });
    return { ...record, schoolId } as unknown as Partial<StudentAttributes>;
  });

  return repo.bulkCreateStudents(records);
};
