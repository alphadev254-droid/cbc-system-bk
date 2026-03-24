import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const createExamType = (data: Prisma.ExamTypeCreateInput) =>
  prisma.examType.create({ data });

export const findExamTypesByTerm = (schoolId: string, termId: string) =>
  prisma.examType.findMany({ where: { schoolId, termId } });

export const findExamTypeById = (id: string, schoolId: string) =>
  prisma.examType.findFirst({ where: { id, schoolId } });

export const upsertStudentMark = (data: Prisma.MarkCreateInput) =>
  prisma.mark.upsert({
    where: {
      studentId_subjectId_examTypeId_termId: {
        studentId:  data.student.connect!.id as string,
        subjectId:  data.subject.connect!.id as string,
        examTypeId: data.examType.connect!.id as string,
        termId:     data.term.connect!.id as string,
      },
    },
    create: data,
    update: { score: data.score, maxScore: data.maxScore },
  });

export const findMarkById = (id: string) =>
  prisma.mark.findUnique({ where: { id } });

export const findMarksByStudent = (studentId: string, termId: string, schoolId: string) =>
  prisma.mark.findMany({
    where:   { studentId, termId, student: { schoolId } },
    include: { subject: true, examType: true },
  });

export const findMarksBySubjectAndTerm = (subjectId: string, termId: string) =>
  prisma.mark.findMany({
    where:   { subjectId, termId },
    include: { student: true, examType: true },
  });

export const approveMarkById = (id: string, approvedBy: string) =>
  prisma.mark.update({
    where: { id },
    data:  { approvedBy, approvedAt: new Date() },
  });
