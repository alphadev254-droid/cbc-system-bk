import Joi from 'joi';

export const createExamTypeSchema = Joi.object({
  name: Joi.string().required(),
  weight: Joi.number().min(0).max(100).required(),
  termId: Joi.string().uuid().required(),
});

export const enterMarksSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  subjectId: Joi.string().uuid().required(),
  examTypeId: Joi.string().uuid().required(),
  termId: Joi.string().uuid().required(),
  score: Joi.number().min(0).required(),
  maxScore: Joi.number().min(1).default(100),
});

export const bulkMarksSchema = Joi.object({
  marks: Joi.array().items(enterMarksSchema).min(1).required(),
});
