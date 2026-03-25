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
  termNumber: number,
  startDate: Date,
  endDate: Date
) => {
  const year = await repo.findAcademicYearById(academicYearId, schoolId);
  if (!year) throw createError('Academic year not found', 404);

  return repo.createTerm({
    termNumber,
    startDate,
    endDate,
    academicYear: { connect: { id: academicYearId } },
    school:       { connect: { id: schoolId } },
  });
};

export const setActiveTerm = async (termId: string, schoolId: string) => {
  const term = await repo.findTermById(termId, schoolId);
  if (!term) throw createError('Term not found', 404);
  await repo.setTermActive(termId, schoolId);
};

export const updateYear = async (id: string, schoolId: string, year: string) => {
  await getYear(id, schoolId);
  return repo.updateAcademicYear(id, year);
};

export const updateTerm = async (
  termId: string,
  schoolId: string,
  data: { startDate?: Date; endDate?: Date }
) => {
  const term = await repo.findTermById(termId, schoolId);
  if (!term) throw createError('Term not found', 404);
  return repo.updateTerm(termId, data);
};

export const deleteYear = async (id: string, schoolId: string) => {
  await getYear(id, schoolId);
  await repo.deleteAcademicYear(id, schoolId);
};

export const deleteTerm = async (termId: string, schoolId: string) => {
  const term = await repo.findTermById(termId, schoolId);
  if (!term) throw createError('Term not found', 404);
  await repo.deleteTerm(termId, schoolId);
};
