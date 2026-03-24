import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { logAction } from '../../services/audit.service';
import * as repo from './school.repository';
import { SchoolAttributes } from '../../models/School.model';
import { Request } from 'express';

export const createSchool = async (
  data: Partial<SchoolAttributes>,
  creatorUserId: string,
  req: Request
) => {
  const existing = await repo.findSchoolByName(data.name as string);
  if (existing) throw createError('School with this name already exists', 409);

  const school = await repo.createSchool(data);

  await logAction(
    creatorUserId,
    school.id,
    'CREATE',
    'School',
    school.id,
    undefined,
    school.toJSON() as unknown as Record<string, unknown>,
    req
  );

  return school;
};

export const getSchools = async (page = 1, limit = 10) => {
  const { rows, count } = await repo.findAllSchools(page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const getSchool = async (id: string) => {
  const school = await repo.findSchoolById(id);
  if (!school) throw createError('School not found', 404);
  return school;
};

export const updateSchool = async (
  id: string,
  data: Partial<SchoolAttributes>,
  userId: string,
  req: Request
) => {
  const school = await getSchool(id);
  const [, [updated]] = await repo.updateSchool(id, data);
  await logAction(
    userId, id, 'UPDATE', 'School', id,
    school.toJSON() as unknown as Record<string, unknown>,
    data as unknown as Record<string, unknown>,
    req
  );
  return updated;
};

export const deleteSchool = async (id: string, userId: string, req: Request) => {
  await getSchool(id);
  await repo.deleteSchool(id);
  await logAction(userId, id, 'DELETE', 'School', id, undefined, undefined, req);
};
