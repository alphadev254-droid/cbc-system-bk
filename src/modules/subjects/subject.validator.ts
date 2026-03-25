import Joi from 'joi';
import { CurriculumType } from '../../config/constants';

export const createSubjectSchema = Joi.object({
  name:          Joi.string().required(),
  description:   Joi.string().optional().allow(''),
  curriculumType: Joi.string().valid(...Object.values(CurriculumType)).required(),
});

export const updateSubjectSchema = Joi.object({
  name:          Joi.string().optional(),
  description:   Joi.string().optional().allow(''),
  curriculumType: Joi.string().valid(...Object.values(CurriculumType)).optional(),
}).min(1);
