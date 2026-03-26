// @ts-nocheck
import { createError } from '../../middleware/errorHandler.middleware';
import { FeeStatus } from '../../config/constants';
import * as repo from './fee.repository';

export const createFeeType = (schoolId: string, data: {
  name: string;
  amount: number;
  frequency: 'per_term' | 'annual' | 'once';
  [key: string]: unknown;
}) => {
  const { schoolId: _s, ...rest } = data;
  return repo.createFeeType({ ...rest, school: { connect: { id: schoolId } } });
};

export const getFeeTypes = (schoolId: string) =>
  repo.findAllFeeTypes(schoolId);

export const assignFee = async (
  studentId: string,
  feeTypeId: string,
  termId: string,
  dueDate: Date,
  customAmount?: number,
  schoolId?: string
) => {
  const feeType = await repo.findFeeTypeById(feeTypeId, schoolId ?? '');
  if (!feeType) throw createError('Fee type not found', 404);

  const amount = customAmount ?? Number(feeType.amount);
  return repo.createFeeRecord({
    student:  { connect: { id: studentId } },
    feeType:  { connect: { id: feeTypeId } },
    term:     { connect: { id: termId } },
    amount,
    dueDate,
    balance:  amount,
  });
};

export const recordPayment = async (data: {
  feeRecordId: string;
  amount: number;
  method: 'mpesa' | 'bank' | 'cash';
  reference: string;
  paidAt: Date;
}) => {
  const record = await repo.findFeeRecordById(data.feeRecordId);
  if (!record) throw createError('Fee record not found', 404);

  const newPaid    = Number(record.paidAmount) + data.amount;
  const newBalance = Number(record.amount) - newPaid;
  const status     = newBalance <= 0 ? FeeStatus.PAID : newPaid > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING;

  await repo.updateFeeRecordById(record.id, {
    paidAmount: newPaid,
    balance:    Math.max(0, newBalance),
    status,
  });

  return repo.createPaymentRecord({
    feeRecord: { connect: { id: record.id } },
    student:   { connect: { id: record.studentId } },
    amount:    data.amount,
    method:    data.method,
    reference: data.reference,
    paidAt:    data.paidAt,
  });
};

export const getFeeStatement = (studentId: string, termId: string, schoolId: string) =>
  repo.findFeeRecordsByStudent(studentId, termId, schoolId);

export const checkBalances = (schoolId: string) =>
  repo.findOverdueFeeRecordsBySchool(schoolId);
