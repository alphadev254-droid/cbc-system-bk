// @ts-nocheck
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler.middleware';
import { Role } from '../../config/constants';

export const listSchoolClasses = async (schoolId: string) =>
  prisma.schoolClass.findMany({
    where: { schoolId },
    include: {
      academicYear: { select: { id: true, year: true } },
      pathway:      { select: { id: true, name: true, gradeLevel: true } },
      classTeacher: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

async function validatePathwayAndTeacher(
  schoolId: string,
  academicYearId: string | null | undefined,
  pathwayId: string | null | undefined,
  classTeacherId: string | null | undefined
) {
  if (pathwayId) {
    const pw = await prisma.pathway.findFirst({
      where: { id: pathwayId, schoolId },
      select: { id: true, academicYearId: true },
    });
    if (!pw) throw createError('Pathway not found', 404);
    if (academicYearId && pw.academicYearId !== academicYearId) {
      throw createError('Pathway must belong to the selected academic year', 400);
    }
  }
  if (classTeacherId) {
    const u = await prisma.user.findFirst({ where: { id: classTeacherId, schoolId } });
    if (!u) throw createError('Class teacher not found in this school', 404);
    if (u.role !== Role.TEACHER && u.role !== Role.HEAD_TEACHER) {
      throw createError('Class teacher must be a teacher or head teacher', 400);
    }
  }
  if (academicYearId) {
    const ay = await prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
    if (!ay) throw createError('Academic year not found', 404);
  }
}

export const createSchoolClass = async (
  schoolId: string,
  data: {
    name: string;
    gradeLevel: string;
    academicYearId?: string | null;
    pathwayId?: string | null;
    classTeacherId?: string | null;
  }
) => {
  await validatePathwayAndTeacher(
    schoolId,
    data.academicYearId ?? null,
    data.pathwayId ?? null,
    data.classTeacherId ?? null
  );

  return prisma.schoolClass.create({
    data: {
      schoolId,
      name: data.name,
      gradeLevel: data.gradeLevel,
      academicYearId: data.academicYearId ?? undefined,
      pathwayId: data.pathwayId ?? undefined,
      classTeacherId: data.classTeacherId ?? undefined,
    },
    include: {
      academicYear: { select: { id: true, year: true } },
      pathway:      { select: { id: true, name: true } },
      classTeacher: { select: { id: true, name: true, email: true } },
    },
  });
};

export const updateSchoolClass = async (
  id: string,
  schoolId: string,
  data: {
    name?: string;
    gradeLevel?: string;
    academicYearId?: string | null;
    pathwayId?: string | null;
    classTeacherId?: string | null;
  }
) => {
  const existing = await prisma.schoolClass.findFirst({ where: { id, schoolId } });
  if (!existing) throw createError('Class not found', 404);

  const academicYearId = data.academicYearId ?? existing.academicYearId;
  const pathwayId = data.pathwayId ?? existing.pathwayId;
  const classTeacherId = data.classTeacherId ?? existing.classTeacherId;

  await validatePathwayAndTeacher(
    schoolId,
    academicYearId,
    pathwayId,
    classTeacherId
  );

  return prisma.schoolClass.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.gradeLevel !== undefined ? { gradeLevel: data.gradeLevel } : {}),
      ...(data.academicYearId !== undefined ? { academicYearId: data.academicYearId } : {}),
      ...(data.pathwayId !== undefined ? { pathwayId: data.pathwayId } : {}),
      ...(data.classTeacherId !== undefined ? { classTeacherId: data.classTeacherId } : {}),
    },
    include: {
      academicYear: { select: { id: true, year: true } },
      pathway:      { select: { id: true, name: true } },
      classTeacher: { select: { id: true, name: true, email: true } },
    },
  });
};

export const deleteSchoolClass = async (id: string, schoolId: string) => {
  const existing = await prisma.schoolClass.findFirst({ where: { id, schoolId } });
  if (!existing) throw createError('Class not found', 404);
  await prisma.schoolClass.delete({ where: { id } });
};
