import { SchoolRole, User } from '../../models';
import { Role } from '../../config/constants';

export const findMembersBySchool = (schoolId: string) =>
  SchoolRole.findAll({
    where: { schoolId, isActive: true },
    include: [{ model: User, as: undefined, attributes: ['id', 'name', 'email'] }],
  });

export const findMemberRole = (userId: string, schoolId: string) =>
  SchoolRole.findOne({ where: { userId, schoolId } });

export const assignMember = (userId: string, schoolId: string, role: Role) =>
  SchoolRole.findOrCreate({
    where:    { userId, schoolId },
    defaults: { userId, schoolId, role, isActive: true },
  });

export const updateMemberRole = (userId: string, schoolId: string, role: Role) =>
  SchoolRole.update({ role, isActive: true }, { where: { userId, schoolId }, returning: true });

export const removeMember = (userId: string, schoolId: string) =>
  SchoolRole.update({ isActive: false }, { where: { userId, schoolId } });
