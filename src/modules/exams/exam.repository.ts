// @ts-nocheck
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const createExamType = (data: Prisma.ExamTypeCreateInput) =>
  prisma.examType.create({ data });

export const findExamTypesByTerm = (schoolId: string, termId: string) =>
  prisma.examType.findMany({ where: { schoolId, termId } });

export const findExamTypeById = (id: string, schoolId: string) =>
  prisma.examType.findFirst({ where: { id, schoolId } });

type MarkUpsertData = {
  studentId: string; subjectId: string; examTypeId: string; termId: string;
  score: number; maxScore: number; enteredById?: string;
}

export const upsertStudentMark = (data: MarkUpsertData) =>
  prisma.mark.upsert({
    where: {
      studentId_subjectId_examTypeId_termId: {
        studentId:  data.studentId,
        subjectId:  data.subjectId,
        examTypeId: data.examTypeId,
        termId:     data.termId,
      },
    },
    create: {
      studentId:   data.studentId,
      subjectId:   data.subjectId,
      examTypeId:  data.examTypeId,
      termId:      data.termId,
      score:       data.score,
      maxScore:    data.maxScore,
      enteredById: data.enteredById ?? null,
    },
    update: { score: data.score, maxScore: data.maxScore, enteredById: data.enteredById ?? null },
  });

export const findMarkById = (id: string) =>
  prisma.mark.findUnique({ where: { id } });

export const findMarksByStudent = (studentId: string, termId: string, schoolId: string) =>
  prisma.mark.findMany({
    where:   { studentId, termId, student: { schoolId } },
    include: { subject: true, examType: true, enteredBy: { select: { id: true, name: true } } },
  });

export const findMarksBySubjectAndTerm = (subjectId: string, termId: string) =>
  prisma.mark.findMany({
    where:   { subjectId, termId },
    include: { student: true, examType: true },
  });

export const deleteExamType = (id: string, schoolId: string) =>
  prisma.examType.deleteMany({ where: { id, schoolId } });

export const approveMarkById = (id: string, approvedBy: string) =>
  prisma.mark.update({
    where: { id },
    data:  { approvedBy, approvedAt: new Date() },
  });
