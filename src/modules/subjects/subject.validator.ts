import Joi from 'joi';
import { CurriculumType } from '../../config/constants';

export const createSubjectSchema = Joi.object({
  name: Joi.string().required(),
  curriculumType: Joi.string().valid(...Object.values(CurriculumType)).required(),
  gradeLevel: Joi.string().required(),
  weeklyHours: Joi.number().integer().min(1).required(),
});

export const updateSubjectSchema = createSubjectSchema.fork(
  ['name', 'curriculumType', 'gradeLevel', 'weeklyHours'],
  (s) => s.optional()
).min(1);
