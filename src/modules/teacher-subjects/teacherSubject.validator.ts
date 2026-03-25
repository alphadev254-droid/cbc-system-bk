import Joi from 'joi';

export const createTeacherSubjectSchema = Joi.object({
  userId:    Joi.string().uuid().required(),
  subjectId: Joi.string().uuid().required(),
});
