import Joi from 'joi';
import { FeeFrequency, PaymentMethod } from '../../config/constants';

export const createFeeTypeSchema = Joi.object({
  name: Joi.string().required(),
  amount: Joi.number().positive().required(),
  frequency: Joi.string().valid(...Object.values(FeeFrequency)).required(),
});

export const assignFeeSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  feeTypeId: Joi.string().uuid().required(),
  termId: Joi.string().uuid().required(),
  dueDate: Joi.date().required(),
  amount: Joi.number().positive().optional(),
});

export const recordPaymentSchema = Joi.object({
  feeRecordId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  method: Joi.string().valid(...Object.values(PaymentMethod)).required(),
  reference: Joi.string().required(),
  paidAt: Joi.date().default(() => new Date()),
});
