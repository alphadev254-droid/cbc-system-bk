import { School } from '../../models';
import { SchoolAttributes } from '../../models/School.model';
import { paginate } from '../../utils/pagination';

export const findAllSchools = (page: number, limit: number) =>
  School.findAndCountAll({ ...paginate(page, limit), order: [['createdAt', 'DESC']] });

export const findSchoolById = (id: string) => School.findByPk(id);

export const findSchoolByName = (name: string) => School.findOne({ where: { name } });

export const createSchool = (data: Partial<SchoolAttributes>) => School.create(data as SchoolAttributes);

export const updateSchool = (id: string, data: Partial<SchoolAttributes>) =>
  School.update(data, { where: { id }, returning: true });

export const deleteSchool = (id: string) => School.destroy({ where: { id } });
