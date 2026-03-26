// @ts-nocheck
import Joi from 'joi';

export const createExamTypeSchema = Joi.object({
  name:          Joi.string().required(),
  weight:        Joi.number().min(0).max(100).required(),
  termId:        Joi.string().uuid().required(),
  gradeLevel:    Joi.string().required(),
  startDate:     Joi.date().iso().optional(),
  marksDeadline: Joi.date().iso().optional(),
});

export const updateExamTypeSchema = Joi.object({
  name:          Joi.string().optional(),
  weight:        Joi.number().min(0).max(100).optional(),
  gradeLevel:    Joi.string().optional(),
  startDate:     Joi.date().iso().optional().allow(null),
  marksDeadline: Joi.date().iso().optional().allow(null),
}).min(1);

export const enterMarksSchema = Joi.object({
  studentId:  Joi.string().uuid().required(),
  subjectId:  Joi.string().uuid().required(),
  examTypeId: Joi.string().uuid().required(),
  termId:     Joi.string().uuid().required(),
  score:      Joi.number().min(0).required(),
  maxScore:   Joi.number().min(1).default(100),
});

export const bulkMarksSchema = Joi.object({
  marks: Joi.array().items(enterMarksSchema).min(1).required(),
});
