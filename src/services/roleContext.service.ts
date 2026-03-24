import { prisma } from '../config/prisma';
import { Role } from '../config/constants';
import { RoleContext } from '../types';

export const resolveRoleContext = async (
  userId: string,
  schoolId: string | null
): Promise<RoleContext | null> => {
  const schoolRole = await prisma.schoolRole.findFirst({
    where: {
      userId,
      schoolId: schoolId ?? null,
      isActive: true,
    },
  });

  if (!schoolRole) return null;

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role: schoolRole.role },
    include: { permission: { select: { key: true } } },
  });

  const permissions = rolePermissions.map((rp) => rp.permission.key);

  let school: RoleContext['school'] = null;
  if (schoolId) {
    const schoolRecord = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, curriculumType: true },
    });
    if (schoolRecord) {
      school = {
        id:             schoolRecord.id,
        name:           schoolRecord.name,
        curriculumType: schoolRecord.curriculumType,
      };
    }
  }

  return {
    userId,
    schoolId,
    role:          schoolRole.role as Role,
    permissions,
    isGlobalAdmin: schoolRole.role === Role.SYSTEM_ADMIN && schoolId === null,
    school,
  };
};

export const getUserSchools = async (userId: string): Promise<RoleContext[]> => {
  const schoolRoles = await prisma.schoolRole.findMany({
    where: { userId, isActive: true },
  });

  const results = await Promise.all(
    schoolRoles.map((sr) => resolveRoleContext(userId, sr.schoolId))
  );

  return results.filter(Boolean) as RoleContext[];
};

export const userHasPermission = async (
  userId: string,
  schoolId: string | null,
  permission: string
): Promise<boolean> => {
  const ctx = await resolveRoleContext(userId, schoolId);
  if (!ctx) return false;
  if (ctx.isGlobalAdmin) return true;
  return ctx.permissions.includes(permission);
};

export const getUserRoleInSchool = async (
  userId: string,
  schoolId: string | null
): Promise<Role | null> => {
  const schoolRole = await prisma.schoolRole.findFirst({
    where: { userId, schoolId: schoolId ?? null, isActive: true },
  });
  return (schoolRole?.role as Role) ?? null;
};
