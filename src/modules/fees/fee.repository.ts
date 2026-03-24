import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const createFeeType = (data: Prisma.FeeTypeCreateInput) =>
  prisma.feeType.create({ data });

export const findAllFeeTypes = (schoolId: string) =>
  prisma.feeType.findMany({ where: { schoolId } });

export const findFeeTypeById = (id: string, schoolId: string) =>
  prisma.feeType.findFirst({ where: { id, schoolId } });

export const createFeeRecord = (data: Prisma.FeeRecordCreateInput) =>
  prisma.feeRecord.create({ data });

export const findFeeRecordById = (id: string) =>
  prisma.feeRecord.findUnique({
    where:   { id },
    include: { payments: true, feeType: true },
  });

export const findFeeRecordsByStudent = (studentId: string, termId: string) =>
  prisma.feeRecord.findMany({
    where:   { studentId, termId },
    include: { feeType: true, payments: true },
  });

export const updateFeeRecordById = (id: string, data: Prisma.FeeRecordUpdateInput) =>
  prisma.feeRecord.update({ where: { id }, data });

export const createPaymentRecord = (data: Prisma.PaymentCreateInput) =>
  prisma.payment.create({ data });

export const findOverdueFeeRecordsBySchool = (schoolId: string) =>
  prisma.feeRecord.findMany({
    where:   { status: 'pending', student: { schoolId } },
    include: { student: true, feeType: true },
  });
