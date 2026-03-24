import { User } from '../../models';
import { UserAttributes } from '../../models/User.model';
import { paginate } from '../../utils/pagination';

export const findAllUsers = (schoolId: string, page: number, limit: number) =>
  User.findAndCountAll({ where: { schoolId }, ...paginate(page, limit), order: [['name', 'ASC']] });

export const findUserById = (id: string, schoolId: string) =>
  User.findOne({ where: { id, schoolId } });

export const findUserByEmail = (email: string) => User.findOne({ where: { email } });

export const createUser = (data: Partial<UserAttributes>) => User.create(data as UserAttributes);

export const updateUser = (id: string, schoolId: string, data: Partial<UserAttributes>) =>
  User.update(data, { where: { id, schoolId }, returning: true });
