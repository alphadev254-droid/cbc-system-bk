// @ts-nocheck
import Joi from 'joi';

export const createTeacherSubjectSchema = Joi.object({
  userId:      Joi.string().uuid().required(),
  subjectId:   Joi.string().uuid().required(),
  gradeLevels: Joi.array().items(Joi.string()).min(1).required(),
});
