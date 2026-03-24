import Joi from 'joi';
import { CurriculumType } from '../../config/constants';

export const createSchoolSchema = Joi.object({
  name: Joi.string().required(),
  county: Joi.string().required(),
  curriculumType: Joi.string().valid(...Object.values(CurriculumType)).required(),
  logo: Joi.string().uri().optional(),
});

export const updateSchoolSchema = Joi.object({
  name: Joi.string(),
  county: Joi.string(),
  curriculumType: Joi.string().valid(...Object.values(CurriculumType)),
  logo: Joi.string().uri(),
  isActive: Joi.boolean(),
}).min(1);

export const assignSubscriptionSchema = Joi.object({
  tierId: Joi.string().uuid().required(),
  billingCycle: Joi.string().valid('monthly', 'annual').required(),
  startDate: Joi.date().required(),
});
