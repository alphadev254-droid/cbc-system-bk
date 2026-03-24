import { createError } from '../../middleware/errorHandler.middleware';
import { FeeStatus } from '../../config/constants';
import { FeeTypeAttributes } from '../../models/FeeType.model';
import { PaymentAttributes } from '../../models/Payment.model';
import * as repo from './fee.repository';

export const createFeeType = (schoolId: string, data: Partial<FeeTypeAttributes>) =>
  repo.createFeeType({ ...data, schoolId });

export const getFeeTypes = (schoolId: string) => repo.findAllFeeTypes(schoolId);

export const assignFee = async (
  studentId: string,
  feeTypeId: string,
  termId: string,
  dueDate: Date,
  customAmount?: number
) => {
  const feeType = await repo.findFeeTypeById(feeTypeId, '');
  if (!feeType) throw createError('Fee type not found', 404);
  const amount = customAmount ?? feeType.amount;
  return repo.createFeeRecord({ studentId, feeTypeId, termId, amount, dueDate, balance: amount });
};

export const recordPayment = async (
  data: Partial<PaymentAttributes> & { feeRecordId: string; amount: number }
) => {
  const record = await repo.findFeeRecordById(data.feeRecordId);
  if (!record) throw createError('Fee record not found', 404);

  const newPaid = Number(record.paidAmount) + data.amount;
  const newBalance = Number(record.amount) - newPaid;
  const status =
    newBalance <= 0 ? FeeStatus.PAID : newPaid > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING;

  await repo.updateFeeRecordById(record.id, {
    paidAmount: newPaid,
    balance: Math.max(0, newBalance),
    status,
  });
  return repo.createPaymentRecord({ ...data, studentId: record.studentId });
};

export const getFeeStatement = (studentId: string, termId: string) =>
  repo.findFeeRecordsByStudent(studentId, termId);

export const checkBalances = (schoolId: string) =>
  repo.findOverdueFeeRecordsBySchool(schoolId);
