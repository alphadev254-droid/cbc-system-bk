import { createError } from '../../middleware/errorHandler.middleware';
import * as repo from './academicYear.repository';

export const createYear = (schoolId: string, year: string) =>
  repo.createAcademicYear(schoolId, year);

export const getYears = (schoolId: string) =>
  repo.findAllAcademicYears(schoolId);

export const getYear = async (id: string, schoolId: string) => {
  const year = await repo.findAcademicYearById(id, schoolId);
  if (!year) throw createError('Academic year not found', 404);
  return year;
};

export const activateYear = async (id: string, schoolId: string) => {
  await getYear(id, schoolId);
  await repo.setAcademicYearActive(id, schoolId);
};

export const createTerm = async (
  schoolId: string,
  academicYearId: string,
  termNumber: 1 | 2 | 3,
  startDate: Date,
  endDate: Date
) => {
  const year = await repo.findAcademicYearById(academicYearId, schoolId);
  if (!year) throw createError('Academic year not found', 404);
  return repo.createTerm({ academicYearId, schoolId, termNumber, startDate, endDate });
};

export const setActiveTerm = async (termId: string, schoolId: string) => {
  const term = await repo.findTermById(termId, schoolId);
  if (!term) throw createError('Term not found', 404);
  await repo.setTermActive(termId, schoolId);
};
