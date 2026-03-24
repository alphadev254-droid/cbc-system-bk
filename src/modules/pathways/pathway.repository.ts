import prisma from '../../config/prisma';
import { PathwayEnrollmentStatus } from '@prisma/client';
import { StudentSubjectsResult } from '../../types';

export const findAllPathways = (
  schoolId: string,
  filters: { gradeLevel?: string; academicYearId?: string; isActive?: boolean }
) =>
  prisma.pathway.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(filters.gradeLevel     && { gradeLevel:     filters.gradeLevel }),
      ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      pathwaySubjects: {
        include: { subject: { select: { id: true, name: true, gradeLevel: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

export const findPathwayById = (id: string, schoolId: string) =>
  prisma.pathway.findFirst({
    where:   { id, schoolId, deletedAt: null },
    include: {
      pathwaySubjects: {
        include: { subject: true },
      },
      studentEnrollments: { select: { id: true, status: true } },
    },
  });

export const createPathway = (data: {
  schoolId: string;
  academicYearId: string;
  name: string;
  description?: string;
  gradeLevel: string;
}) =>
  prisma.pathway.create({ data });

export const updatePathway = (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
  prisma.pathway.update({ where: { id }, data });

export const softDeletePathway = (id: string) =>
  prisma.pathway.update({ where: { id }, data: { deletedAt: new Date() } });

export const addSubjectsToPathway = (
  pathwayId: string,
  subjects: Array<{ subjectId: string; isCompulsory: boolean }>
) =>
  prisma.$transaction(
    subjects.map((s) =>
      prisma.pathwaySubject.upsert({
        where:  { pathwayId_subjectId: { pathwayId, subjectId: s.subjectId } },
        create: { pathwayId, subjectId: s.subjectId, isCompulsory: s.isCompulsory },
        update: { isCompulsory: s.isCompulsory },
      })
    )
  );

export const removeSubjectFromPathway = (pathwayId: string, subjectId: string) =>
  prisma.pathwaySubject.delete({
    where: { pathwayId_subjectId: { pathwayId, subjectId } },
  });

export const enrollStudent = (data: { studentId: string; pathwayId: string; termId: string }) =>
  prisma.studentPathway.create({
    data: { ...data, status: 'ACTIVE' },
  });

export const bulkEnrollStudents = async (
  studentIds: string[],
  pathwayId: string,
  termId: string
): Promise<number> => {
  const result = await prisma.studentPathway.createMany({
    data:           studentIds.map((studentId) => ({ studentId, pathwayId, termId, status: 'ACTIVE' as PathwayEnrollmentStatus })),
    skipDuplicates: true,
  });
  return result.count;
};

export const getStudentSubjects = async (
  studentId: string,
  termId: string,
  schoolId: string
): Promise<StudentSubjectsResult> => {
  const enrollment = await prisma.studentPathway.findFirst({
    where: { studentId, termId, status: 'ACTIVE', deletedAt: null },
    include: {
      pathway: {
        where: { schoolId },
        include: {
          pathwaySubjects: {
            include: { subject: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!enrollment?.pathway) {
    return { pathwayId: null, pathwayName: null, subjects: [] };
  }

  return {
    pathwayId:   enrollment.pathway.id,
    pathwayName: enrollment.pathway.name,
    subjects:    enrollment.pathway.pathwaySubjects.map((ps) => ({
      id:           ps.subject.id,
      name:         ps.subject.name,
      isCompulsory: ps.isCompulsory,
    })),
  };
};

export const getStudentsInPathway = (pathwayId: string, termId: string) =>
  prisma.studentPathway.findMany({
    where:   { pathwayId, termId, status: 'ACTIVE' },
    include: { student: { select: { id: true, fullName: true, admissionNumber: true, grade: true } } },
  });

export const countActiveEnrollments = (pathwayId: string) =>
  prisma.studentPathway.count({ where: { pathwayId, status: 'ACTIVE', deletedAt: null } });

export const findStudentEnrollmentForTerm = (studentId: string, termId: string) =>
  prisma.studentPathway.findFirst({
    where: { studentId, termId, status: 'ACTIVE', deletedAt: null },
  });

export const transferStudent = (
  studentId: string,
  currentTermId: string,
  toPathwayId: string,
  toTermId: string
) =>
  prisma.$transaction([
    prisma.studentPathway.updateMany({
      where: { studentId, termId: currentTermId, status: 'ACTIVE' },
      data:  { status: 'TRANSFERRED' },
    }),
    prisma.studentPathway.create({
      data: { studentId, pathwayId: toPathwayId, termId: toTermId, status: 'ACTIVE' },
    }),
  ]);

export const findMarksForSubjectInPathway = (pathwayId: string, subjectId: string) =>
  prisma.mark.findFirst({
    where: {
      subjectId,
      student: {
        pathwayEnrollments: { some: { pathwayId, status: 'ACTIVE' } },
      },
    },
  });
