import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findAllStudents = (schoolId: string, page: number, limit: number) =>
  prisma.$transaction([
    prisma.student.findMany({
      where:   { schoolId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { fullName: 'asc' },
    }),
    prisma.student.count({ where: { schoolId } }),
  ]);

export const findStudentById = (id: string, schoolId: string) =>
  prisma.student.findFirst({
    where:   { id, schoolId },
    include: { parent: { select: { id: true, name: true, email: true } } },
  });

export const findStudentByAdmissionNumber = (admissionNumber: string, schoolId: string) =>
  prisma.student.findFirst({ where: { admissionNumber, schoolId } });

export const createStudent = (data: Prisma.StudentCreateInput) =>
  prisma.student.create({ data });

export const updateStudent = (id: string, data: Prisma.StudentUpdateInput) =>
  prisma.student.update({ where: { id }, data });

export const bulkCreateStudents = (records: Prisma.StudentCreateManyInput[]) =>
  prisma.student.createMany({ data: records, skipDuplicates: true });
