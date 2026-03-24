import { FeeType, FeeRecord, Payment } from '../../models';
import { FeeTypeAttributes } from '../../models/FeeType.model';
import { FeeRecordAttributes } from '../../models/FeeRecord.model';
import { PaymentAttributes } from '../../models/Payment.model';
import { FeeStatus } from '../../config/constants';

export const createFeeType = (data: Partial<FeeTypeAttributes>) =>
  FeeType.create(data as FeeTypeAttributes);

export const findAllFeeTypes = (schoolId: string) =>
  FeeType.findAll({ where: { schoolId } });

export const findFeeTypeById = (id: string, schoolId: string) =>
  FeeType.findOne({ where: { id, schoolId } });

export const createFeeRecord = (data: Partial<FeeRecordAttributes>) =>
  FeeRecord.create(data as FeeRecordAttributes);

export const findFeeRecordById = (id: string) =>
  FeeRecord.findByPk(id, {
    include: [{ association: 'payments' }, { association: 'feeType' }],
  });

export const findFeeRecordsByStudent = (studentId: string, termId: string) =>
  FeeRecord.findAll({
    where: { studentId, termId },
    include: [{ association: 'feeType' }, { association: 'payments' }],
  });

export const updateFeeRecordById = (id: string, data: Partial<FeeRecordAttributes>) =>
  FeeRecord.update(data, { where: { id }, returning: true });

export const createPaymentRecord = (data: Partial<PaymentAttributes>) =>
  Payment.create(data as PaymentAttributes);

export const findOverdueFeeRecordsBySchool = (schoolId: string) =>
  FeeRecord.findAll({
    where: { status: FeeStatus.PENDING },
    include: [{ association: 'student', where: { schoolId } }, { association: 'feeType' }],
  });
