import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler.middleware';
import { Role } from '../../config/constants';

export const listTeacherSubjects = async (schoolId: string) =>
  prisma.teacherSubject.findMany({
    where: { schoolId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      subject: {
        select: { id: true, name: true, gradeLevel: true, curriculumType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

export const createTeacherSubject = async (
  schoolId: string,
  userId: string,
  subjectId: string,
  gradeLevels: string[]
) => {
  const user = await prisma.user.findFirst({ where: { id: userId, schoolId } });
  if (!user) throw createError('User not found in this school', 404);
  if (user.role !== Role.TEACHER && user.role !== Role.HEAD_TEACHER) {
    throw createError('Only teachers can be assigned to subjects', 400);
  }

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) throw createError('Subject not found', 404);

  const results = [];
  for (const gradeLevel of gradeLevels) {
    const existing = await prisma.teacherSubject.findFirst({ where: { userId, subjectId, gradeLevel } });
    if (!existing) {
      const created = await prisma.teacherSubject.create({
        data: { schoolId, userId, subjectId, gradeLevel },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          subject: { select: { id: true, name: true, gradeLevel: true } },
        },
      });
      results.push(created);
    }
  }
  return results;
};

export const deleteTeacherSubject = async (id: string, schoolId: string) => {
  const row = await prisma.teacherSubject.findFirst({ where: { id, schoolId } });
  if (!row) throw createError('Mapping not found', 404);
  await prisma.teacherSubject.delete({ where: { id } });
};
