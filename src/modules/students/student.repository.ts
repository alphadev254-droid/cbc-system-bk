// @ts-nocheck
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findAllStudents = (schoolId: string, page: number, limit: number) =>
  prisma.$transaction([
    prisma.student.findMany({
      where:   { schoolId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { fullName: 'asc' },
      include: { parent: { select: { id: true, name: true, email: true, phoneNumber: true } } },
    }),
    prisma.student.count({ where: { schoolId } }),
  ]);

export const findStudentById = (id: string, schoolId: string) =>
  prisma.student.findFirst({
    where:   { id, schoolId },
    include: {
      parent: { select: { id: true, name: true, email: true } },
      pathwayEnrollments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          pathway: { select: { id: true, name: true } },
          studentSubjects: {
            include: { subject: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

export const findStudentByAdmissionNumber = (admissionNumber: string, schoolId: string) =>
  prisma.student.findFirst({ where: { admissionNumber, schoolId } });

export const createStudent = (data: Prisma.StudentCreateInput) =>
  prisma.student.create({ data });

export const updateStudent = (id: string, data: Prisma.StudentUpdateInput) =>
  prisma.student.update({ where: { id }, data });

export const deleteStudent = async (id: string) => {
  const enrollments = await prisma.studentPathway.findMany({ where: { studentId: id }, select: { id: true } })
  const enrollmentIds = enrollments.map((e) => e.id)

  await prisma.$transaction([
    prisma.studentSubject.deleteMany({ where: { studentPathwayId: { in: enrollmentIds } } }),
    prisma.studentPathway.deleteMany({ where: { studentId: id } }),
    prisma.mark.deleteMany({ where: { studentId: id } }),
    prisma.payment.deleteMany({ where: { studentId: id } }),
    prisma.feeRecord.deleteMany({ where: { studentId: id } }),
    prisma.student.delete({ where: { id } }),
  ])
}

export const bulkCreateStudents = (records: Prisma.StudentCreateManyInput[]) =>
  prisma.student.createMany({ data: records, skipDuplicates: true });
