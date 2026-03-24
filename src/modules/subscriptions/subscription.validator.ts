import Joi from 'joi';
import { BillingCycle } from '../../config/constants';

export const createTierSchema = Joi.object({
  name: Joi.string().required(),
  monthlyPrice: Joi.number().positive().required(),
  annualPrice: Joi.number().positive().required(),
  maxStudents: Joi.number().integer().positive().required(),
  modules: Joi.array().items(Joi.string()).required(),
});

export const updateTierSchema = createTierSchema.fork(
  ['name', 'monthlyPrice', 'annualPrice', 'maxStudents', 'modules'],
  (s) => s.optional()
).min(1);

export const assignTierSchema = Joi.object({
  schoolId: Joi.string().uuid().required(),
  tierId: Joi.string().uuid().required(),
  billingCycle: Joi.string().valid(...Object.values(BillingCycle)).required(),
  startDate: Joi.date().required(),
});
